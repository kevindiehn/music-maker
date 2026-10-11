package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"homedepot-pp-cli/internal/config"
)

// Client wraps an http.Client configured for Home Depot's API.
type Client struct {
	cfg  *config.Config
	http *http.Client
}

// New creates a Client from the given config.
func New(cfg *config.Config) *Client {
	return &Client{
		cfg: cfg,
		http: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GraphQLRequest is the payload sent to the HD GraphQL endpoint.
type GraphQLRequest struct {
	OperationName string         `json:"operationName"`
	Variables     map[string]any `json:"variables"`
	Query         string         `json:"query"`
}

// PostGraphQL sends a GraphQL query to the HD federation gateway.
func (c *Client) PostGraphQL(ctx context.Context, req GraphQLRequest, out any) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.cfg.BaseURL+"/federation-gateway/graphql", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}

	// Apply configured headers.
	for k, v := range c.cfg.Headers {
		httpReq.Header.Set(k, v)
	}
	// Always set these content headers.
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	// Browser-like user agent.
	httpReq.Header.Set("User-Agent",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return fmt.Errorf("http post: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HD API returned %d: %s", resp.StatusCode, string(b))
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}
