package cli

import (
	"fmt"
	"sort"
	"sync"

	"github.com/spf13/cobra"
)

func newProductsAisleMapCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "aisle-map",
		Short: "Group a keyword list by aisle/bay location",
		Example: `  homedepot-pp-cli products aisle-map --list items.txt
  homedepot-pp-cli products aisle-map --list items.txt --store-id 4718 --json`,
		Annotations: map[string]string{
			"mcp:read-only": "true",
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			listFile, _ := cmd.Flags().GetString("list")
			storeID, zipCode := storeFlags(cmd)
			useJSON := jsonFlag(cmd)

			keywords, err := readKeywordList(listFile)
			if err != nil {
				return err
			}
			if len(keywords) == 0 {
				return fmt.Errorf("no keywords provided")
			}

			c, err := newClient()
			if err != nil {
				return err
			}
			ctx := cmd.Context()

			results := make([]hdItemResult, len(keywords))
			var wg sync.WaitGroup
			for i, kw := range keywords {
				wg.Add(1)
				go func(idx int, keyword string) {
					defer wg.Done()
					results[idx] = hdLookupKeyword(ctx, c, keyword, storeID, zipCode)
				}(i, kw)
			}
			wg.Wait()

			// Group by aisle/bay.
			byAisle := map[string][]hdItemResult{}
			for _, r := range results {
				key := r.AisleBay
				if key == "" || r.Err != nil {
					key = "~" // sort last
				}
				byAisle[key] = append(byAisle[key], r)
			}

			aisles := make([]string, 0, len(byAisle))
			for k := range byAisle {
				aisles = append(aisles, k)
			}
			sort.Strings(aisles)

			if useJSON {
				out := map[string][]map[string]any{}
				for _, aisle := range aisles {
					displayKey := aisle
					if aisle == "~" {
						displayKey = "unknown"
					}
					for _, r := range byAisle[aisle] {
						m := map[string]any{
							"keyword":  r.Keyword,
							"item_id":  r.ItemId,
							"name":     r.Name,
							"in_stock": r.InStock,
							"qty":      r.Qty,
						}
						if r.Err != nil {
							m["error"] = r.Err.Error()
						}
						out[displayKey] = append(out[displayKey], m)
					}
				}
				return printJSON(out)
			}

			for _, aisle := range aisles {
				display := aisle
				if aisle == "~" {
					display = "(no aisle/unknown)"
				}
				fmt.Printf("\n=== %s ===\n", display)
				for _, r := range byAisle[aisle] {
					if r.Err != nil {
						fmt.Printf("  %-30s  ERROR: %v\n", truncate(r.Keyword, 30), r.Err)
						continue
					}
					stockStr := "OUT"
					if r.InStock {
						stockStr = fmt.Sprintf("qty:%d", r.Qty)
					}
					name := r.Name
					if r.Brand != "" {
						name = r.Brand + " " + name
					}
					fmt.Printf("  %-30s  [%s] %-8s %s\n",
						truncate(r.Keyword, 30), r.ItemId, stockStr, truncate(name, 40))
				}
			}
			return nil
		},
	}

	cmd.Flags().String("list", "", "Path to keyword list file (one per line); omit for stdin")
	cmd.Flags().String("store-id", "2559", "Store ID")
	cmd.Flags().String("zip-code", "21704", "ZIP code")
	cmd.Flags().Bool("json", false, "Output as JSON")

	return cmd
}
