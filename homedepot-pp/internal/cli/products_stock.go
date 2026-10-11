package cli

import (
	"fmt"

	"github.com/spf13/cobra"
)

func newProductsStockCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "stock",
		Short: "Get in-store stock and aisle/bay location for a specific item",
		Example: `  homedepot-pp-cli products stock --item-id 202093622
  homedepot-pp-cli products stock --keyword "2x4 lumber" --store-id 4718 --json`,
		Annotations: map[string]string{
			"mcp:read-only": "true",
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			itemId, _ := cmd.Flags().GetString("item-id")
			keyword, _ := cmd.Flags().GetString("keyword")
			storeID, zipCode := storeFlags(cmd)
			useJSON := jsonFlag(cmd)

			if itemId == "" && keyword == "" {
				return fmt.Errorf("one of --item-id or --keyword is required")
			}

			c, err := newClient()
			if err != nil {
				return err
			}
			ctx := cmd.Context()

			if itemId == "" {
				itemId, _, _, _, _, err = hdSearchTop(ctx, c, keyword, storeID, zipCode)
				if err != nil {
					return fmt.Errorf("search: %w", err)
				}
			}

			aisleBay, inStock, qty, name, brand, price, unit, err := hdGetStock(ctx, c, itemId, storeID, zipCode)
			if err != nil {
				return fmt.Errorf("stock lookup: %w", err)
			}

			if useJSON {
				return printJSON(map[string]any{
					"item_id":   itemId,
					"name":      name,
					"brand":     brand,
					"price":     price,
					"unit":      unit,
					"in_stock":  inStock,
					"qty":       qty,
					"aisle_bay": aisleBay,
					"store_id":  storeID,
				})
			}

			stockStr := "OUT OF STOCK"
			if inStock {
				stockStr = fmt.Sprintf("IN STOCK (qty: %d)", qty)
			}
			aisleStr := aisleBay
			if aisleStr == "" {
				aisleStr = "—"
			}
			fmt.Printf("[%s] %s %s\n", itemId, brand, name)
			if price > 0 {
				fmt.Printf("Price:     $%.2f/%s\n", price, unit)
			}
			fmt.Printf("Store:     #%s\n", storeID)
			fmt.Printf("Stock:     %s\n", stockStr)
			fmt.Printf("Aisle/Bay: %s\n", aisleStr)
			return nil
		},
	}

	cmd.Flags().String("item-id", "", "Home Depot item ID")
	cmd.Flags().String("keyword", "", "Search keyword (used if --item-id not provided)")
	cmd.Flags().String("store-id", "2559", "Store ID")
	cmd.Flags().String("zip-code", "21704", "ZIP code")
	cmd.Flags().Bool("json", false, "Output as JSON")

	return cmd
}
