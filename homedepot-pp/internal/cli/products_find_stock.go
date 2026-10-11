package cli

import (
	"fmt"
	"sort"
	"strings"
	"sync"

	"github.com/spf13/cobra"
)

type storeStockResult struct {
	StoreID  string
	AisleBay string
	InStock  bool
	Qty      int
	Err      error
}

func newProductsFindStockCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "find-stock",
		Short: "Check stock for an item across multiple stores, sorted by qty",
		Example: `  homedepot-pp-cli products find-stock --keyword "2x4 lumber"
  homedepot-pp-cli products find-stock --item-id 202093622 --store-ids 2559,4718,1523
  homedepot-pp-cli products find-stock --keyword "drywall screws" --json`,
		Annotations: map[string]string{
			"mcp:read-only": "true",
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			itemId, _ := cmd.Flags().GetString("item-id")
			keyword, _ := cmd.Flags().GetString("keyword")
			_, zipCode := storeFlags(cmd)
			storeIdsStr, _ := cmd.Flags().GetString("store-ids")
			useJSON := jsonFlag(cmd)

			if itemId == "" && keyword == "" {
				return fmt.Errorf("one of --item-id or --keyword is required")
			}

			storeIds := strings.Split(storeIdsStr, ",")
			for i, s := range storeIds {
				storeIds[i] = strings.TrimSpace(s)
			}

			c, err := newClient()
			if err != nil {
				return err
			}
			ctx := cmd.Context()

			// Resolve item ID.
			var itemName, itemBrand string
			if itemId == "" {
				var searchErr error
				itemId, itemName, itemBrand, _, _, searchErr = hdSearchTop(ctx, c, keyword, storeIds[0], zipCode)
				if searchErr != nil {
					return fmt.Errorf("search: %w", searchErr)
				}
			}

			// Check each store in parallel.
			storeResults := make([]storeStockResult, len(storeIds))
			var wg sync.WaitGroup
			for i, sid := range storeIds {
				wg.Add(1)
				go func(idx int, storeID string) {
					defer wg.Done()
					aisle, inStock, qty, name, brand, _, _, err := hdGetStock(ctx, c, itemId, storeID, zipCode)
					storeResults[idx] = storeStockResult{
						StoreID:  storeID,
						AisleBay: aisle,
						InStock:  inStock,
						Qty:      qty,
						Err:      err,
					}
					if itemName == "" && name != "" {
						itemName = name
					}
					if itemBrand == "" && brand != "" {
						itemBrand = brand
					}
				}(i, sid)
			}
			wg.Wait()

			// Sort by qty descending, errors last.
			sort.Slice(storeResults, func(i, j int) bool {
				if storeResults[i].Err != nil && storeResults[j].Err == nil {
					return false
				}
				if storeResults[i].Err == nil && storeResults[j].Err != nil {
					return true
				}
				return storeResults[i].Qty > storeResults[j].Qty
			})

			displayName := itemName
			if itemBrand != "" {
				displayName = itemBrand + " " + itemName
			}

			if useJSON {
				rows := make([]map[string]any, len(storeResults))
				for i, sr := range storeResults {
					m := map[string]any{
						"store_id":  sr.StoreID,
						"in_stock":  sr.InStock,
						"qty":       sr.Qty,
						"aisle_bay": sr.AisleBay,
					}
					if sr.Err != nil {
						m["error"] = sr.Err.Error()
					}
					rows[i] = m
				}
				return printJSON(map[string]any{
					"item_id": itemId,
					"name":    displayName,
					"stores":  rows,
				})
			}

			fmt.Printf("[%s] %s\n\n", itemId, displayName)
			fmt.Printf("%-10s %-8s %-14s %s\n", "STORE", "QTY", "AISLE/BAY", "STATUS")
			fmt.Println(strings.Repeat("-", 50))
			for _, sr := range storeResults {
				if sr.Err != nil {
					fmt.Printf("%-10s %-8s %-14s ERROR: %v\n", sr.StoreID, "—", "—", sr.Err)
					continue
				}
				status := "out of stock"
				if sr.InStock {
					status = "in stock"
				}
				aisle := sr.AisleBay
				if aisle == "" {
					aisle = "—"
				}
				fmt.Printf("%-10s %-8d %-14s %s\n", sr.StoreID, sr.Qty, truncate(aisle, 14), status)
			}
			return nil
		},
	}

	cmd.Flags().String("item-id", "", "Home Depot item ID")
	cmd.Flags().String("keyword", "", "Search keyword")
	cmd.Flags().String("zip-code", "21704", "ZIP code")
	cmd.Flags().String("store-ids", "2559,4718,1523,1110", "Comma-separated store IDs to check")
	cmd.Flags().Bool("json", false, "Output as JSON")

	return cmd
}
