package cli

import (
	"fmt"
	"time"

	"github.com/spf13/cobra"
)

func newProductsWatchCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "watch",
		Short: "Poll stock for an item and alert on threshold crossings",
		Example: `  homedepot-pp-cli products watch --item-id 202093622 --below 5
  homedepot-pp-cli products watch --keyword "2x4 lumber" --interval 10m --above 0`,
		Annotations: map[string]string{
			"mcp:read-only": "true",
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			itemId, _ := cmd.Flags().GetString("item-id")
			keyword, _ := cmd.Flags().GetString("keyword")
			storeID, zipCode := storeFlags(cmd)
			interval, _ := cmd.Flags().GetDuration("interval")
			below, _ := cmd.Flags().GetInt("below")
			above, _ := cmd.Flags().GetInt("above")

			if itemId == "" && keyword == "" {
				return fmt.Errorf("one of --item-id or --keyword is required")
			}
			if interval < time.Second {
				interval = 5 * time.Minute
			}

			c, err := newClient()
			if err != nil {
				return err
			}
			ctx := cmd.Context()

			// Resolve item ID if only keyword given.
			if itemId == "" {
				var resolvedName string
				itemId, resolvedName, _, _, _, err = hdSearchTop(ctx, c, keyword, storeID, zipCode)
				if err != nil {
					return fmt.Errorf("search: %w", err)
				}
				fmt.Printf("Watching %q → [%s] %s\n", keyword, itemId, resolvedName)
			}

			fmt.Printf("Polling every %v (Ctrl+C to stop)...\n\n", interval)

			prevQty := -1
			ticker := time.NewTicker(interval)
			defer ticker.Stop()

			poll := func() {
				aisleBay, inStock, qty, name, brand, price, unit, err := hdGetStock(ctx, c, itemId, storeID, zipCode)
				ts := time.Now().Format("15:04:05")
				if err != nil {
					fmt.Printf("[%s] ERROR: %v\n", ts, err)
					return
				}

				changed := prevQty != qty
				alert := false
				alertMsg := ""
				if below > 0 && qty < below && (prevQty < 0 || prevQty >= below) {
					alert = true
					alertMsg = fmt.Sprintf("⚠ BELOW %d", below)
				}
				if above > 0 && qty > above && (prevQty < 0 || prevQty <= above) {
					alert = true
					alertMsg = fmt.Sprintf("✓ ABOVE %d", above)
				}

				if prevQty < 0 || changed || alert {
					stockStr := "OUT"
					if inStock {
						stockStr = fmt.Sprintf("qty:%d", qty)
					}
					aisleStr := aisleBay
					if aisleStr == "" {
						aisleStr = "—"
					}
					pricePart := ""
					if price > 0 {
						pricePart = fmt.Sprintf(" $%.2f/%s", price, unit)
					}
					namePart := name
					if brand != "" {
						namePart = brand + " " + name
					}
					line := fmt.Sprintf("[%s] %s | %s | aisle:%s%s | %s",
						ts, stockStr, truncate(namePart, 35), aisleStr, pricePart, itemId)
					if alertMsg != "" {
						line = "*** " + alertMsg + " *** " + line
					}
					fmt.Println(line)
				}
				prevQty = qty
			}

			// First poll immediately.
			poll()

			for {
				select {
				case <-ctx.Done():
					return nil
				case <-ticker.C:
					poll()
				}
			}
		},
	}

	cmd.Flags().String("item-id", "", "Home Depot item ID to watch")
	cmd.Flags().String("keyword", "", "Search keyword (resolved to item ID at start)")
	cmd.Flags().String("store-id", "2559", "Store ID")
	cmd.Flags().String("zip-code", "21704", "ZIP code")
	cmd.Flags().Duration("interval", 5*time.Minute, "Polling interval")
	cmd.Flags().Int("below", 0, "Alert when qty drops below N (0 = disabled)")
	cmd.Flags().Int("above", 0, "Alert when qty rises above N (0 = disabled)")
	cmd.Flags().Bool("json", false, "Output as JSON")

	return cmd
}
