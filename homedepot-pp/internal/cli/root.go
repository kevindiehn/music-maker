package cli

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"homedepot-pp-cli/internal/client"
	"homedepot-pp-cli/internal/config"
)

// rootFlags holds global flags.
type rootFlags struct {
	debug   bool
	storeID string
	zipCode string
	jsonOut bool
}

var rootCmd *cobra.Command

func init() {
	rf := &rootFlags{}
	rootCmd = &cobra.Command{
		Use:   "homedepot-pp-cli",
		Short: "Home Depot CLI — look up in-store aisle location and live stock",
		Long: `homedepot-pp-cli is a read-only CLI for Home Depot's private GraphQL API.

Given a store ID and an item query it returns:
  • Aisle/bay location
  • Live in-store stock quantity

Default store: Frederick, MD #2559 (storeId=2559, zipCode=21704)

WARNING: This reverse-engineers Home Depot's private app API and likely
violates their ToS. Personal/experimental use only. The endpoint may
change at any time.`,
		SilenceUsage:  true,
		SilenceErrors: true,
	}

	pf := rootCmd.PersistentFlags()
	pf.BoolVar(&rf.debug, "debug", false, "Enable debug logging")
	pf.BoolVar(&rf.jsonOut, "json", false, "Output as JSON")
	pf.StringVar(&rf.storeID, "store-id", "2559", "Home Depot store ID")
	pf.StringVar(&rf.zipCode, "zip-code", "21704", "ZIP code for the store")

	rootCmd.AddCommand(newProductsCmd(rf))
}

// Execute runs the root command.
func Execute() error {
	return rootCmd.Execute()
}

// RunMCP starts the MCP server.
func RunMCP() error {
	fmt.Fprintln(os.Stderr, "MCP server mode not yet implemented. Use homedepot-pp-cli directly.")
	return nil
}

// newClient creates an API client from the current config.
func newClient() (*client.Client, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}
	return client.New(cfg), nil
}

// printJSON prints v as indented JSON to stdout.
func printJSON(v any) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}

// storeFlags returns store-id and zip-code from a command's flags.
func storeFlags(cmd *cobra.Command) (storeID, zipCode string) {
	storeID, _ = cmd.Flags().GetString("store-id")
	zipCode, _ = cmd.Flags().GetString("zip-code")
	if storeID == "" {
		storeID = "2559"
	}
	if zipCode == "" {
		zipCode = "21704"
	}
	return
}

// jsonFlag returns the --json flag value from a command.
func jsonFlag(cmd *cobra.Command) bool {
	v, _ := cmd.Flags().GetBool("json")
	return v
}
