package config

import (
	"os"
	"path/filepath"
)

// Config holds all runtime configuration.
type Config struct {
	BaseURL  string
	Headers  map[string]string
	StoreID  string
	ZipCode  string
	CacheDir string
	Debug    bool
}

// Load returns a Config with sensible defaults for Home Depot.
func Load() (*Config, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		home = "."
	}

	cfg := &Config{
		BaseURL:  "https://www.homedepot.com",
		StoreID:  "2559",
		ZipCode:  "21704",
		CacheDir: filepath.Join(home, ".homedepot-pp-cli", "cache"),
		Headers:  map[string]string{},
	}

	// Required Home Depot API headers.
	hdDefaults := map[string]string{
		"X-Experience-Name": "b2c",
		"X-Api-Cookies":     `{"x-user-zip":"21704","x-user-store-nickname":"Frederick"}`,
		"Origin":            "https://www.homedepot.com",
		"Referer":           "https://www.homedepot.com/",
		"Accept":            "application/json",
		"Content-Type":      "application/json",
	}
	for k, v := range hdDefaults {
		if _, ok := cfg.Headers[k]; !ok {
			cfg.Headers[k] = v
		}
	}

	return cfg, nil
}
