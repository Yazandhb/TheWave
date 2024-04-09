import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import {
  SearchFilters,
  CardGrid,
  StyledCardGrid,
  fetchAdvancedSearch,
  SkeletonCard,
} from '../index';

// Define types for genre, year, season, format, and status
type Option = { value: string; label: string };
type Genre = Option;
type Year = Option;
type Season = Option;
type Format = Option;
type Status = Option;

const Container = styled.div`
  margin-top: 1rem;

  @media (min-width: 1500px) {
    margin-left: 8rem;
    margin-right: 8rem;
    margin-top: 2rem;
  }
`;

const anyOption: Option = { value: '', label: 'Any' };

const SearchSort = () => {
  const [searchParams /* setSearchParams */] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [query, setQuery] = useState<string>(initialQuery);
  const [animeData, setAnimeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const delayTimeout = useRef<number | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedYear, setSelectedYear] = useState<Year>(anyOption);
  const [selectedSeason, setSelectedSeason] = useState<Season>(anyOption);
  const [selectedFormat, setSelectedFormat] = useState<Format>(anyOption);
  const [selectedStatus, setSelectedStatus] = useState<Status>(anyOption);
  const [selectedSort, setSelectedSort] = useState<Option>({
    value: 'POPULARITY',
    label: 'Popularity ',
  });
  const [sortDirection, setSortDirection] = useState<'DESC' | 'ASC'>('DESC');

  useEffect(() => {
    const previousTitle = document.title;
    document.title = query ? `${query} - Miruro` : 'Miruro';
    return () => {
      document.title = previousTitle;
    };
  }, [query]);

  useEffect(() => {
    setPage(1);

    const scrollToTopWithDelay = () => {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 250);
    };

    scrollToTopWithDelay();
  }, [query]);

  const initiateFetchAdvancedSearch = useCallback(async () => {
    setIsLoading(true);
    const sortParam = `${selectedSort.value}_${sortDirection}`;

    try {
      const yearFilter = selectedYear.value || undefined;
      const formatFilter = selectedFormat.value || undefined;
      const statusFilter = selectedStatus.value || undefined;
      const seasonFilter = selectedSeason.value || undefined;

      const fetchedData = await fetchAdvancedSearch(query, page, 17, {
        genres: selectedGenres.map((g) => g.value),
        year: yearFilter,
        season: seasonFilter,
        format: formatFilter,
        status: statusFilter,
        sort: [sortParam], // Wrap sortParam in an array
      });

      if (page === 1) {
        setAnimeData(fetchedData.results);
      } else {
        setAnimeData((prevData) => [...prevData, ...fetchedData.results]);
      }
      setHasNextPage(fetchedData.hasNextPage);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    query,
    page,
    selectedGenres,
    selectedYear,
    selectedSeason,
    selectedFormat,
    selectedStatus,
    sortDirection,
  ]);

  const handleLoadMore = () => {
    setPage((prevPage) => {
      return prevPage < 10 ? prevPage + 1 : prevPage;
      setHasNextPage(false);
    });
  };

  useEffect(() => {
    const newQuery = searchParams.get('query') || '';
    if (newQuery !== query) {
      setQuery(newQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    // Clear existing timeout to ensure no double fetches
    if (delayTimeout.current !== null) clearTimeout(delayTimeout.current);

    // Debounce to minimize fetches during rapid state changes
    delayTimeout.current = window.setTimeout(() => {
      initiateFetchAdvancedSearch();
    }, 0);

    // Cleanup timeout on unmount or before executing a new fetch
    return () => {
      if (delayTimeout.current !== null) clearTimeout(delayTimeout.current);
    };
  }, [initiateFetchAdvancedSearch]); // Include all dependencies here

  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedYear(anyOption);
    setSelectedSeason(anyOption);
    setSelectedFormat(anyOption);
    setSelectedStatus(anyOption);
    setSelectedSort({ value: 'POPULARITY', label: 'Popularity' }); // Assuming 'Popularity' is the default
    setSortDirection('DESC'); // Assuming 'DESC' is the default
    // Add any other states that need to be reset
  };

  return (
    <Container>
      <SearchFilters
        query={query}
        setQuery={setQuery}
        selectedGenres={selectedGenres}
        setSelectedGenres={setSelectedGenres}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedSort={selectedSort} // New
        setSelectedSort={setSelectedSort} // New
        sortDirection={sortDirection} // New
        setSortDirection={setSortDirection} // New
        resetFilters={resetFilters}
      />
      {isLoading && page === 1 ? (
        <StyledCardGrid>
          {Array.from({ length: 17 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </StyledCardGrid>
      ) : (
        <CardGrid
          animeData={animeData}
          hasNextPage={hasNextPage}
          onLoadMore={handleLoadMore}
        />
      )}
      {!isLoading && animeData.length === 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '10vh',
            fontWeight: 'bold',
            fontSize: '1.5rem',
          }}
        >
          No Results
        </div>
      )}
    </Container>
  );
};

export default SearchSort;
