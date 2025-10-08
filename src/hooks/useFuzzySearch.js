import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';

// Simple fuzzy search implementation
const fuzzyMatch = (text, query) => {
  if (!text || !query) return false;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    return { score: 100, match: true };
  }
  
  // Character-by-character fuzzy matching
  let textIndex = 0;
  let queryIndex = 0;
  let matches = 0;
  
  while (textIndex < textLower.length && queryIndex < queryLower.length) {
    if (textLower[textIndex] === queryLower[queryIndex]) {
      matches++;
      queryIndex++;
    }
    textIndex++;
  }
  
  // Calculate score based on matches
  const score = (matches / queryLower.length) * 80; // Max 80 for fuzzy matches
  
  return {
    score: score,
    match: score > 50 // Threshold for considering it a match
  };
};

// Advanced fuzzy search with multiple fields
const searchItems = (items, query, searchFields = ['name']) => {
  if (!query || query.trim().length === 0) {
    return items;
  }
  
  const results = items
    .map(item => {
      let bestScore = 0;
      let matchedField = null;
      
      // Search across multiple fields
      searchFields.forEach(field => {
        const fieldValue = item[field];
        if (fieldValue) {
          const result = fuzzyMatch(fieldValue, query);
          if (result.match && result.score > bestScore) {
            bestScore = result.score;
            matchedField = field;
          }
        }
      });
      
      return {
        ...item,
        _searchScore: bestScore,
        _matchedField: matchedField
      };
    })
    .filter(item => item._searchScore > 0)
    .sort((a, b) => b._searchScore - a._searchScore);
  
  return results;
};

// Hook for fuzzy search functionality
export const useFuzzySearch = (items = [], searchFields = ['name'], options = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 1,
    maxResults = 100
  } = options;
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce the search query
  const debouncedQuery = useDebounce(query, debounceMs);
  
  // Memoized search results
  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < minQueryLength) {
      return items;
    }
    
    setIsSearching(true);
    
    const results = searchItems(items, debouncedQuery, searchFields);
    const limitedResults = results.slice(0, maxResults);
    
    setIsSearching(false);
    
    return limitedResults;
  }, [items, debouncedQuery, searchFields, minQueryLength, maxResults]);
  
  // Effect to handle search state
  useEffect(() => {
    if (query !== debouncedQuery && query.trim().length >= minQueryLength) {
      setIsSearching(true);
    }
  }, [query, debouncedQuery, minQueryLength]);
  
  // Clear search
  const clearSearch = () => {
    setQuery('');
    setIsSearching(false);
  };
  
  // Search statistics
  const searchStats = useMemo(() => {
    const hasQuery = debouncedQuery && debouncedQuery.trim().length >= minQueryLength;
    const totalItems = items.length;
    const resultCount = searchResults.length;
    
    return {
      hasQuery,
      query: debouncedQuery,
      totalItems,
      resultCount,
      filteredCount: hasQuery ? resultCount : totalItems,
      isFiltered: hasQuery && resultCount < totalItems
    };
  }, [debouncedQuery, items.length, searchResults.length, minQueryLength]);
  
  return {
    query,
    setQuery,
    searchResults,
    isSearching,
    clearSearch,
    searchStats
  };
};

// Hook for real-time search with API integration
export const useApiSearch = (searchFn, options = {}) => {
  const {
    debounceMs = 500,
    minQueryLength = 2,
    cacheResults = true
  } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache] = useState(new Map());
  
  const debouncedQuery = useDebounce(query, debounceMs);
  
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < minQueryLength) {
        setResults([]);
        setError(null);
        return;
      }
      
      const trimmedQuery = debouncedQuery.trim();
      
      // Check cache first
      if (cacheResults && cache.has(trimmedQuery)) {
        setResults(cache.get(trimmedQuery));
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const searchResults = await searchFn(trimmedQuery);
        setResults(searchResults);
        
        // Cache results
        if (cacheResults) {
          cache.set(trimmedQuery, searchResults);
        }
      } catch (err) {
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [debouncedQuery, searchFn, minQueryLength, cacheResults, cache]);
  
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };
  
  const clearCache = () => {
    cache.clear();
  };
  
  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    clearCache
  };
};

// Utility function for highlighting search matches
export const highlightMatches = (text, query) => {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export default useFuzzySearch;