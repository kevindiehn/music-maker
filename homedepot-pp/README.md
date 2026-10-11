# homedepot-pp-cli

A read-only CLI for checking in-store stock and aisle/bay location at Home Depot.

> **ToS Warning**: This reverse-engineers Home Depot's private app API and likely violates their Terms of Service. Personal/experimental use only. The endpoint may change at any time.

## Build

```bash
go build -o homedepot-pp-cli ./cmd/homedepot-pp-cli
```

## Commands

### `products search`
Search for products by keyword.
```bash
homedepot-pp-cli products search --keyword "2x4 lumber"
homedepot-pp-cli products search --keyword "drill bit" --store-id 4718 --json
```

### `products stock`
Get in-store stock and aisle/bay for a specific item.
```bash
homedepot-pp-cli products stock --item-id 202093622
homedepot-pp-cli products stock --keyword "drywall screws" --store-id 2559
```

### `products check-list`
Check stock for a list of keywords (one per line).
```bash
homedepot-pp-cli products check-list --list items.txt
echo -e "2x4 lumber\ndrywall screws" | homedepot-pp-cli products check-list
```

### `products aisle-map`
Group a keyword list by aisle/bay location — useful for efficient in-store navigation.
```bash
homedepot-pp-cli products aisle-map --list items.txt
```

### `products watch`
Poll an item's stock and alert on threshold crossings (Ctrl+C to stop).
```bash
homedepot-pp-cli products watch --keyword "2x4 lumber" --below 5 --interval 10m
homedepot-pp-cli products watch --item-id 202093622 --above 0
```

### `products bundle`
Check all items in a bundle YAML; exits 1 if any are out of stock.
```bash
homedepot-pp-cli products bundle deck-project.yaml
```

Example bundle YAML:
```yaml
project: Deck Build
store_id: "2559"
zip_code: "21704"
items:
  - 2x4x8 pressure treated lumber
  - deck screws 3 inch
  - joist hanger
```

### `products find-stock`
Check stock across multiple stores, sorted by quantity.
```bash
homedepot-pp-cli products find-stock --keyword "2x4 lumber"
homedepot-pp-cli products find-stock --item-id 202093622 --store-ids 2559,4718,1523,1110
```

## Default Store

Frederick, MD #2559 (`--store-id 2559 --zip-code 21704`)

## Global Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--store-id` | `2559` | Home Depot store ID |
| `--zip-code` | `21704` | ZIP code |
| `--json` | `false` | JSON output |
| `--debug` | `false` | Debug logging |
