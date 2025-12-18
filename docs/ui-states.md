# UI States

This document covers loading states, error states, and skeletons used throughout the frontend.

---

## Loading Architecture

We use **TanStack Query** for data fetching. This provides:

- Automatic caching and deduplication
- Built-in loading/error states
- Background refetching

### When to use TanStack Query

Use TanStack Query for **standard CRUD operations**:
- Fetching user profiles
- Loading channel lists
- Getting documents, links, settings

**Do NOT use** TanStack Query for:
- WebSocket-driven real-time data (messages, presence)
- Optimistic UI that needs fine-grained control

### Hook Pattern

```tsx
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../trpc";

export const useChannels = (userId: string) =>
  useQuery({
    queryKey: ["channels", userId],
    queryFn: () => trpc.channels.list.query({ userId }),
    staleTime: 30_000,
    enabled: !!userId,
  });
```

### Suspense Boundaries

Suspense boundaries should wrap **meaningful sections** of the UI, not individual components. The goal is to have only a few loading states visible at once, not a loading spinner for every tiny piece of UI.

**Principles:**
- Wrap entire views or panels, not individual elements
- If essential data (like who you're chatting with) isn't loaded, the whole section should show a loading state
- Avoid many small Suspense boundaries that cause jarring partial loads
- Use `useSuspenseQuery` for data that's required to render a section

**Good example** - one boundary for the entire channel view:

```tsx
<Suspense fallback={<ChannelViewSkeleton />}>
  <ChannelView channelId={channelId} userId={userId} />
</Suspense>
```

**Bad example** - separate boundaries for header and content:

```tsx
<Suspense fallback={<HeaderSkeleton />}>
  <ChannelHeader channelId={channelId} />
</Suspense>
<Suspense fallback={<MessagesSkeleton />}>
  <MessageList channelId={channelId} />
</Suspense>
```

### Inline Loading (Non-Suspense)

**Use inline loading (`isLoading`)** when:
- Headers or controls should remain visible during loading
- Navigation elements (sidebars, tabs) that shouldn't disappear
- Secondary data that can load after the main content

Example of inline loading (preferred for navigation):

```tsx
const { data: channels = [], isLoading } = useChannels(userId);

return (
  <div>
    <Header title="Messages" onAdd={openNewMessage} />
    {isLoading ? <ChannelListSkeleton /> : <ChannelItems channels={channels} />}
  </div>
);
```

---

## Loading States

### Generic `LoadingState`

Use for full-page or section-wide loading when you don't need a custom skeleton:

```tsx
import { LoadingState } from "@/components/ui/LoadingState";

<LoadingState message="Loading your profile..." />
```

Displays a centered spinner with optional message.

### When to use LoadingState vs Skeleton

| Scenario | Use |
|----------|-----|
| Page-level loading | `LoadingState` |
| Initial app load | `LoadingState` |
| List or card content | Skeleton |
| Form submission | Button loading state |
| Known content structure | Skeleton |

---

## Skeletons

Skeletons provide visual placeholders that match the shape of the content being loaded.

### Using the Skeleton Component

Import from shadcn:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-32" />
<Skeleton className="h-8 w-8 rounded-full" />
```

### Creating a Custom Skeleton

Keep skeletons minimal - just the loading content, not surrounding chrome:

```tsx
export const ChannelListSkeleton = () => (
  <>
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-4 mx-3 my-1.5" />
    ))}
  </>
);
```

This lets the parent component keep headers/controls visible while only the content loads.

### Naming Convention

Name skeleton components as `{Component}Skeleton`:
- `ChannelListSkeleton`
- `ProfileCardSkeleton`

Place skeleton files alongside their corresponding components.

---

## Error States

### Generic `ErrorState`

Use for displaying errors with optional retry:

```tsx
import { ErrorState } from "@/components/ui/ErrorState";

<ErrorState
  message="Failed to load channels"
  onRetry={() => refetch()}
/>
```

### ErrorBoundary

Wrap sections that might throw during render (useful with Suspense):

```tsx
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

<ErrorBoundary fallback={<ErrorState message="Something went wrong" />}>
  <SomeComponent />
</ErrorBoundary>
```

---

## File Locations

| Component | Path |
|-----------|------|
| `Skeleton` | `src/components/ui/skeleton.tsx` |
| `LoadingState` | `src/components/ui/LoadingState.tsx` |
| `ErrorState` | `src/components/ui/ErrorState.tsx` |
| `ErrorBoundary` | `src/components/ui/ErrorBoundary.tsx` |
| `queryClient` | `src/queryClient.ts` |
| Feature skeletons | Alongside their components (e.g. `src/chat/ChannelListSkeleton.tsx`) |

---

## Checklist for New Features

When adding a new data-fetching feature:

1. Create a hook using `useQuery`
2. Decide: should headers/controls stay visible during loading?
   - Yes → use inline `isLoading` check
   - No → consider Suspense
3. If showing skeleton: create minimal `{Component}Skeleton.tsx`
4. Handle error state with `isError` or ErrorBoundary
5. Test loading state (throttle network in DevTools)


