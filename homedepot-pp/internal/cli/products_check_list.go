package cli

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"

	"github.com/spf13/cobra"
)

func newProductsCheckListCmd(rf *rootFlags) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "check-list",
		Short: "Check in-store stock for a list of keywords",
		Example: `  homedepot-pp-cli products check-list --list items.txt
  echo -e "2x4 lumber\ndrywall screws" | homedepot-pp-cli products check-list
  homedepot-pp-cli products check-list --list items.txt --json`,
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

			if useJSON {
				out := make([]map[string]any, len(results))
				for i, r := range results {
					m := map[string]any{
						"keyword":   r.Keyword,
						"item_id":   r.ItemId,
						"name":      r.Name,
						"brand":     r.Brand,
						"in_stock":  r.InStock,
						"qty":       r.Qty,
						"aisle_bay": r.AisleBay,
					}
					if r.Err != nil {
						m["error"] = r.Err.Error()
					}
					out[i] = m
				}
				return printJSON(out)
			}

			printCheckListTable(results)
			return nil
		},
	}

	cmd.Flags().String("list", "", "Path to keyword list file (one keyword per line); omit to read from stdin")
	cmd.Flags().String("store-id", "2559", "Store ID")
	cmd.Flags().String("zip-code", "21704", "ZIP code")
	cmd.Flags().Bool("json", false, "Output as JSON")

	return cmd
}

// readKeywordList reads one keyword per line from path or stdin if path is "".
func readKeywordList(path string) ([]string, error) {
	var r io.Reader
	if path == "" {
		r = os.Stdin
	} else {
		f, err := os.Open(path)
		if err != nil {
			return nil, fmt.Errorf("open list file: %w", err)
		}
		defer f.Close()
		r = f
	}

	var keywords []string
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		keywords = append(keywords, line)
	}
	return keywords, sc.Err()
}

// printCheckListTable prints a formatted table of results.
func printCheckListTable(results []hdItemResult) {
	fmt.Printf("%-30s %-12s %-8s %-12s %s\n", "KEYWORD", "ITEM ID", "QTY", "AISLE/BAY", "NAME")
	fmt.Println(strings.Repeat("-", 85))
	for _, r := range results {
		if r.Err != nil {
			fmt.Printf("%-30s %-12s %-8s %-12s ERROR: %v\n",
				truncate(r.Keyword, 30), "—", "—", "—", r.Err)
			continue
		}
		stockStr := fmt.Sprintf("%d", r.Qty)
		if !r.InStock {
			stockStr = "0"
		}
		aisle := r.AisleBay
		if aisle == "" {
			aisle = "—"
		}
		name := r.Name
		if r.Brand != "" {
			name = r.Brand + " " + name
		}
		fmt.Printf("%-30s %-12s %-8s %-12s %s\n",
			truncate(r.Keyword, 30), r.ItemId, stockStr, truncate(aisle, 12), truncate(name, 35))
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-1] + "…"
}
