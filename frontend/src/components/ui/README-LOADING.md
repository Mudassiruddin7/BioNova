# Centralized Loading Screen Component

This document explains how to use the centralized `LoadingScreen` component in the BioNova application.

## Basic Usage

The `LoadingScreen` component provides a consistent, modern, and customizable loading experience across the application.

### Direct Import

```tsx
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Function that sets loading to true during data fetching
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch data...
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {/* Show loading screen when loading */}
      {isLoading && <LoadingScreen text="Loading data..." />}
      
      {/* Rest of your component */}
    </div>
  );
}
```

## Props

The `LoadingScreen` component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | boolean | `true` | Controls whether the loading screen is shown |
| `text` | string | `'Loading...'` | The text to display below the loading animation |
| `fullScreen` | boolean | `true` | Whether the loading screen should cover the entire viewport |
| `transparent` | boolean | `false` | If true, background will be transparent; otherwise, it will have a semi-transparent backdrop |
| `size` | 'small' \| 'medium' \| 'large' | `'medium'` | Controls the size of the loading animation |

## Using LoadingWrapper

For convenience, we also provide a `LoadingWrapper` component and HOC:

```tsx
import { LoadingWrapper, withLoading } from '@/components/LoadingWrapper';

// As a wrapper component
export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <LoadingWrapper isLoading={isLoading} loadingText="Loading content...">
      {/* Your component content */}
    </LoadingWrapper>
  );
}

// As a Higher-Order Component
const MyComponent = ({ data }) => {
  // Component implementation...
};

// Wrap with loading HOC
export default withLoading(MyComponent, { 
  loadingText: "Loading component...",
  minLoadTime: 500 // Show loading for at least 500ms
});
```

## Best Practices

1. **Consistent Messages**: Use consistent loading messages across similar operations.
2. **Appropriate Size**: Use the appropriate size for the context (e.g., 'small' for inline loading, 'large' for full-page operations).
3. **Descriptive Text**: Provide specific loading messages that indicate what's happening (e.g., "Analyzing DNA sequence..." instead of just "Loading...").
4. **Prevent Multiple Loaders**: Avoid having multiple loading indicators on the same page.

## Implementation Locations

The centralized loading screen has been implemented in the following locations:

- `AuthProvider.tsx` - For authentication loading states
- `PrivateRoute.tsx` - For route protection loading
- `login/page.tsx` - For login/registration loading
- `crispr-predictor/page.tsx` - For DNA sequence analysis loading 