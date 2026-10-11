package main

import (
	"fmt"
	"os"

	"homedepot-pp-cli/internal/cli"
)

func main() {
	if err := cli.RunMCP(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
