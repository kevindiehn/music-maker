package cli

import (
	"fmt"
	"os"
	"sync"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
)

// bundleFile is the structure of a bundle YAML.
type bundleFile struct {
	Project string   `yaml:"project"`
	StoreID string   `yaml:"store_id"`
	ZipCode string   `yaml:"zip_code"`
	Items   []string `yaml:"items"`
}

func newProductsBundleCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "bundle [bundle.yaml]",
		Short: "Check stock for all items in a bundle YAML and exit 1 if any are out of stock",
		Example: `  homedepot-pp-cli products bundle deck-project.yaml
  homedepot-pp-cli products bundle --file deck-project.yaml --json

  # Example bundle YAML:
  # project: Deck Build
  # store_id: "2559"
  # zip_code: "21704"
  # items:
  #   - 2x4x8 pressure treated lumber
  #   - deck screws 3 inch
  #   - joist hanger`,
		Annotations: map[string]string{
			"mcp:read-only": "true",
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			filePath, _ := cmd.Flags().GetString("file")
			if filePath == "" && len(args) > 0 {
				filePath = args[0]
			}
			if filePath == "" {
				return fmt.Errorf("bundle YAML file required (positional arg or --file)")
			}

			storeIDFlag, zipCodeFlag := storeFlags(cmd)
			useJSON := jsonFlag(cmd)

			data, err := os.ReadFile(filePath)
			if err != nil {
				return fmt.Errorf("read bundle file: %w", err)
			}

			var bundle bundleFile
			if err := yaml.Unmarshal(data, &bundle); err != nil {
				return fmt.Errorf("parse bundle YAML: %w", err)
			}

			// Flags override bundle file values.
			storeID := bundle.StoreID
			if storeIDFlag != "2559" || storeID == "" {
				storeID = storeIDFlag
			}
			zipCode := bundle.ZipCode
			if zipCodeFlag != "21704" || zipCode == "" {
				zipCode = zipCodeFlag
			}

			if len(bundle.Items) == 0 {
				return fmt.Errorf("bundle has no items")
			}

			c, err := newClient()
			if err != nil {
				return err
			}
			ctx := cmd.Context()

			results := make([]hdItemResult, len(bundle.Items))
			var wg sync.WaitGroup
			for i, kw := range bundle.Items {
				wg.Add(1)
				go func(idx int, keyword string) {
					defer wg.Done()
					results[idx] = hdLookupKeyword(ctx, c, keyword, storeID, zipCode)
				}(i, kw)
			}
			wg.Wait()

			outOfStock := 0
			errors := 0
			for _, r := range results {
				if r.Err != nil {
					errors++
				} else if !r.InStock {
					outOfStock++
				}
			}
			allInStock := outOfStock == 0 && errors == 0

			if useJSON {
				items := make([]map[string]any, len(results))
				for i, r := range results {
					m := map[string]any{
						"keyword":   r.Keyword,
						"item_id":   r.ItemId,
						"name":      r.Name,
						"in_stock":  r.InStock,
						"qty":       r.Qty,
						"aisle_bay": r.AisleBay,
					}
					if r.Err != nil {
						m["error"] = r.Err.Error()
					}
					items[i] = m
				}
				printJSON(map[string]any{
					"project":      bundle.Project,
					"store_id":     storeID,
					"all_in_stock": allInStock,
					"out_of_stock": outOfStock,
					"errors":       errors,
					"items":        items,
				})
			} else {
				if bundle.Project != "" {
					fmt.Printf("Bundle: %s  (store #%s)\n\n", bundle.Project, storeID)
				}
				printCheckListTable(results)
				fmt.Println()
				if allInStock {
					fmt.Println("✓ All items in stock")
				} else {
					fmt.Printf("✗ %d out of stock, %d errors\n", outOfStock, errors)
				}
			}

			if !allInStock {
				os.Exit(1)
			}
			return nil
		},
	}

	cmd.Flags().String("file", "", "Path to bundle YAML file")
	cmd.Flags().String("store-id", "2559", "Store ID (overrides bundle file)")
	cmd.Flags().String("zip-code", "21704", "ZIP code (overrides bundle file)")
	cmd.Flags().Bool("json", false, "Output as JSON")

	return cmd
}
