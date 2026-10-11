package cli

import (
	"github.com/spf13/cobra"
)

func newProductsCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "products",
		Short: "Search products and look up in-store stock with aisle and bay location",
		Annotations: map[string]string{
			"mcp:read-only": "true",
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			return cmd.Help()
		},
	}

	cmd.AddCommand(newProductsSearchCmd(rf))
	cmd.AddCommand(newProductsStockCmd(rf))
	cmd.AddCommand(newProductsCheckListCmd(rf))
	cmd.AddCommand(newProductsAisleMapCmd(rf))
	cmd.AddCommand(newProductsWatchCmd(rf))
	cmd.AddCommand(newProductsBundleCmd(rf))
	cmd.AddCommand(newProductsFindStockCmd(rf))

	return cmd
}
