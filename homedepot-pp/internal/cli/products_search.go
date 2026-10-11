package cli

import (
	"fmt"

	"github.com/spf13/cobra"
	"homedepot-pp-cli/internal/client"
)

func newProductsSearchCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "search",
		Short: "Search for products by keyword",
		Example: `  homedepot-pp-cli products search --keyword "2x4 lumber"
  homedepot-pp-cli products search --keyword "drill bit" --store-id 4718 --json`,
		Annotations: map[string]string{
			"mcp:read-only": "true",
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			keyword, _ := cmd.Flags().GetString("keyword")
			if keyword == "" {
				return fmt.Errorf("--keyword is required")
			}
			storeID, zipCode := storeFlags(cmd)
			pageSize, _ := cmd.Flags().GetInt("page-size")
			useJSON := jsonFlag(cmd)

			c, err := newClient()
			if err != nil {
				return err
			}
			ctx := cmd.Context()

			var resp hdSearchResponse
			err = c.PostGraphQL(ctx, client.GraphQLRequest{
				OperationName: "searchModel",
				Variables: map[string]any{
					"keyword":    keyword,
					"storeId":    storeID,
					"zipCode":    zipCode,
					"pageSize":   pageSize,
					"startIndex": 0,
				},
				Query: hdSearchQuery,
			}, &resp)
			if err != nil {
				return fmt.Errorf("search: %w", err)
			}
			if len(resp.Errors) > 0 {
				return fmt.Errorf("graphql: %s", resp.Errors[0].Message)
			}

			products := resp.Data.SearchModel.Products
			total := resp.Data.SearchModel.Metadata.TotalProducts

			if useJSON {
				return printJSON(map[string]any{
					"total":    total,
					"products": products,
				})
			}

			fmt.Printf("Results for %q (showing %d of %d):\n\n", keyword, len(products), total)
			for _, p := range products {
				priceStr := ""
				if p.Pricing.Value > 0 {
					priceStr = fmt.Sprintf(" — $%.2f/%s", p.Pricing.Value, p.Pricing.UnitOfMeasure)
				}
				fmt.Printf("  [%s] %s %s%s\n", p.ItemId, p.Identifiers.BrandName, p.Identifiers.ProductLabel, priceStr)
			}
			return nil
		},
	}

	cmd.Flags().String("keyword", "", "Search keyword (required)")
	cmd.Flags().String("store-id", "2559", "Store ID")
	cmd.Flags().String("zip-code", "21704", "ZIP code")
	cmd.Flags().Int("page-size", 12, "Number of results to return")
	cmd.Flags().Bool("json", false, "Output as JSON")

	return cmd
}
