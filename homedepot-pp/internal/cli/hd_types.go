package cli

import (
	"context"
	"fmt"
	"strings"

	"homedepot-pp-cli/internal/client"
)

// pp:data-source live

const hdSearchQuery = `
query searchModel($keyword: String!, $storeId: String, $zipCode: String, $pageSize: Int, $startIndex: Int) {
  searchModel(keyword: $keyword, storeId: $storeId, zipCode: $zipCode, filter: {}) {
    products(pageSize: $pageSize, startIndex: $startIndex) {
      itemId
      identifiers {
        productLabel
        brandName
        modelNumber
      }
      pricing(storeId: $storeId) {
        value
        unitOfMeasure
      }
    }
    metadata {
      totalProducts
    }
  }
}
`

const hdStockQuery = `
query productClientOnlyProduct($itemId: String!, $storeId: String, $zipCode: String) {
  product(itemId: $itemId) {
    itemId
    identifiers {
      productLabel
      brandName
    }
    pricing(storeId: $storeId) {
      value
      unitOfMeasure
    }
    fulfillment(storeId: $storeId, zipCode: $zipCode) {
      backordered
      fulfillmentOptions {
        type
        fulfillable
        services {
          locations {
            isInStock
            inventory {
              quantity
            }
            storageLocationLabel
            locationId
            store {
              storeName
            }
            type
          }
        }
      }
    }
  }
}
`

// HD response types.

type hdSearchResponse struct {
	Data struct {
		SearchModel struct {
			Products []hdProduct `json:"products"`
			Metadata struct {
				TotalProducts int `json:"totalProducts"`
			} `json:"metadata"`
		} `json:"searchModel"`
	} `json:"data"`
	Errors []struct{ Message string } `json:"errors"`
}

type hdProduct struct {
	ItemId      string `json:"itemId"`
	Identifiers struct {
		ProductLabel string `json:"productLabel"`
		BrandName    string `json:"brandName"`
		ModelNumber  string `json:"modelNumber"`
	} `json:"identifiers"`
	Pricing struct {
		Value         float64 `json:"value"`
		UnitOfMeasure string  `json:"unitOfMeasure"`
	} `json:"pricing"`
}

type hdStockResponse struct {
	Data struct {
		Product struct {
			ItemId      string `json:"itemId"`
			Identifiers struct {
				ProductLabel string `json:"productLabel"`
				BrandName    string `json:"brandName"`
			} `json:"identifiers"`
			Pricing struct {
				Value         float64 `json:"value"`
				UnitOfMeasure string  `json:"unitOfMeasure"`
			} `json:"pricing"`
			Fulfillment struct {
				Backordered        bool                  `json:"backordered"`
				FulfillmentOptions []hdFulfillmentOption `json:"fulfillmentOptions"`
			} `json:"fulfillment"`
		} `json:"product"`
	} `json:"data"`
	Errors []struct{ Message string } `json:"errors"`
}

type hdFulfillmentOption struct {
	Type        string      `json:"type"`
	Fulfillable bool        `json:"fulfillable"`
	Services    []hdService `json:"services"`
}

type hdService struct {
	Locations []hdLocation `json:"locations"`
}

type hdLocation struct {
	IsInStock            bool   `json:"isInStock"`
	StorageLocationLabel string `json:"storageLocationLabel"`
	LocationId           string `json:"locationId"`
	Type                 string `json:"type"`
	Inventory            struct {
		Quantity int `json:"quantity"`
	} `json:"inventory"`
	Store struct {
		StoreName string `json:"storeName"`
	} `json:"store"`
}

// hdStoreLocation extracts aisle/bay, in-stock flag, and qty from fulfillment options.
func hdStoreLocation(opts []hdFulfillmentOption) (aisleBay string, inStock bool, qty int) {
	for _, opt := range opts {
		if strings.ToLower(opt.Type) != "bopis" && strings.ToLower(opt.Type) != "store" {
			continue
		}
		for _, svc := range opt.Services {
			for _, loc := range svc.Locations {
				if loc.IsInStock {
					inStock = true
				}
				if loc.Inventory.Quantity > qty {
					qty = loc.Inventory.Quantity
				}
				if loc.StorageLocationLabel != "" && aisleBay == "" {
					aisleBay = loc.StorageLocationLabel
				}
			}
		}
	}
	return
}

// hdSearchTop searches for a keyword and returns the top result.
func hdSearchTop(ctx context.Context, c *client.Client, keyword, storeId, zipCode string) (itemId, name, brand string, price float64, unit string, err error) {
	var resp hdSearchResponse
	err = c.PostGraphQL(ctx, client.GraphQLRequest{
		OperationName: "searchModel",
		Variables: map[string]any{
			"keyword":    keyword,
			"storeId":    storeId,
			"zipCode":    zipCode,
			"pageSize":   1,
			"startIndex": 0,
		},
		Query: hdSearchQuery,
	}, &resp)
	if err != nil {
		return
	}
	if len(resp.Errors) > 0 {
		err = fmt.Errorf("graphql: %s", resp.Errors[0].Message)
		return
	}
	if len(resp.Data.SearchModel.Products) == 0 {
		err = fmt.Errorf("no products found for %q", keyword)
		return
	}
	p := resp.Data.SearchModel.Products[0]
	return p.ItemId, p.Identifiers.ProductLabel, p.Identifiers.BrandName, p.Pricing.Value, p.Pricing.UnitOfMeasure, nil
}

// hdGetStock fetches stock info for a specific item ID.
func hdGetStock(ctx context.Context, c *client.Client, itemId, storeId, zipCode string) (aisleBay string, inStock bool, qty int, name, brand string, price float64, unit string, err error) {
	var resp hdStockResponse
	err = c.PostGraphQL(ctx, client.GraphQLRequest{
		OperationName: "productClientOnlyProduct",
		Variables: map[string]any{
			"itemId":  itemId,
			"storeId": storeId,
			"zipCode": zipCode,
		},
		Query: hdStockQuery,
	}, &resp)
	if err != nil {
		return
	}
	if len(resp.Errors) > 0 {
		err = fmt.Errorf("graphql: %s", resp.Errors[0].Message)
		return
	}
	p := resp.Data.Product
	name = p.Identifiers.ProductLabel
	brand = p.Identifiers.BrandName
	price = p.Pricing.Value
	unit = p.Pricing.UnitOfMeasure
	aisleBay, inStock, qty = hdStoreLocation(p.Fulfillment.FulfillmentOptions)
	return
}

// hdItemResult bundles the result of a single keyword lookup.
type hdItemResult struct {
	Keyword  string
	ItemId   string
	Name     string
	Brand    string
	Price    float64
	Unit     string
	AisleBay string
	InStock  bool
	Qty      int
	Err      error
}

// hdLookupKeyword searches for a keyword then gets stock.
func hdLookupKeyword(ctx context.Context, c *client.Client, keyword, storeId, zipCode string) hdItemResult {
	r := hdItemResult{Keyword: keyword}
	var err error
	r.ItemId, r.Name, r.Brand, r.Price, r.Unit, err = hdSearchTop(ctx, c, keyword, storeId, zipCode)
	if err != nil {
		r.Err = err
		return r
	}
	r.AisleBay, r.InStock, r.Qty, r.Name, r.Brand, r.Price, r.Unit, err = hdGetStock(ctx, c, r.ItemId, storeId, zipCode)
	if err != nil {
		r.Err = err
	}
	return r
}
