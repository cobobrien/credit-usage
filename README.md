# Credit Usage Dashboard

# Run Locally

### Prerequisites

- Docker
- Docker Compose

### Run

```bash
docker compose up --build
```

This should expose the web client on  [http://localhost:5173/](http://localhost:5173/)  

The Backend API should be running on [http://0.0.0.0:8000](http://0.0.0.0:8000/) but the web client should already be configured to talk to it

### Stop

```bash
docker compose down
```

# Testing

## Backend

### Prerequisites

- A Python venv with `requirements.txt` installed

```bash
pytest */tests/*
```

## Web

### Prerequisites

- Node
- `yarn` with the dependencies from `package.json` installed

From inside the `web/usage-dashboard` directory run:

```bash
yarn vitest
```

# Overview

This is a simple [FastAPI](https://fastapi.tiangolo.com/) app with a single exposed endpoint at `/usage`. The web client is a React app built using [Vite](https://vite.dev/).

## Backend/API Overview

A tonne of easy optimisations have been left out here due to time constraints. Messages and Reports are fetched, and the credit usage costs are calculated all within the request-response lifecycle of the `/usage` endpoint. Ideally, this would all be computed async, with the usage data and credits being stored in a data store, or even just in a cache. This could be achieved with either a cron job using a cadence of whatever the acceptable lag time of the Credit Usage Dashboard is, or if new messages were processed by this service from a message queue.

### Optimisations

Two small optimisations I did make use of was the `functools.lru_cache` decorator when:

1. fetching the report:

```python
@lru_cache
def get_report(report_id: int) -> Optional[Report]:
    """Fetch the report cost from the report API."""
```

I made the assumption here that report credits were immutable

1. calculating a word cost

```python
@lru_cache
def calculate_word_cost(word: str) -> float:
    """Calculates cost for a single word based on its length.""" 
```

These additions mean that while the first requests to the `/usage` endpoint are slow, subsequent requests take a fraction of the time.

## Client Side Overview

The app state is driven by URL query params, which means that a user can share a link to the app and the sorting choices will be reflected

### Sorting & Pagination

Given that the constraints were for the current period only, sorting is done on the client side only. I made the assumption that the volume of data was easily manageable on the client-side alone. Also, as I decided to include pagination on the client-side, it made sense for the sorting to handled there too.

For both, I leaned into [TanStack Table](https://tanstack.com/table/latest) to do the heavy lifting. It provided:

1. **Sorting**:
- Built-in multi-column sorting
- Type-safe sort functions
- Automatic handling of sort state
- URL state persistence (as implemented in this code)

1. **Pagination**:
- Automatic page size management
- Built-in pagination calculations
- Memory efficient (only processes visible rows)
- Easy-to-use pagination controls

### Client Side Fetching

The web also makes use of [React Query](https://tanstack.com/query/latest) which provides some nice benefits:

**Data Fetching & Caching**:

- Automatic caching of usage data
- Built-in loading and error states
- Automatic background refetching

**Loading State Handling**:

- Clean loading state management without manual flags
- Skeleton loading UI during data fetch

One nice feature of using React Query is that both the table and bar chart components can share the response from the `/usage` endpoint without requiring a common parent component to propagate the data down to them both. The shared `usageData` query key is enough for them to re-render according to the response from the usage request

### Other mentions

I also made use of Tailwind and [shadcn/ui](https://ui.shadcn.com/docs) just because I wanted to see what all the hype was about 😄 - the UI components in the `/web/usage-dashboard/src/components/ui` directory were not created by me. There were added using the CLI e.g. `npx shadcn@latest add skeleton`

### Concessions

I didn’t include the pagination in the URL params. It wasn’t mentioned as a requirement and I didn’t want to spend more time on it as a nice-to-have
