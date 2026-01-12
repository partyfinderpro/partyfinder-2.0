import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteContent(category?: string) {
    return useInfiniteQuery({
        queryKey: ['content', category],
        queryFn: async ({ pageParam = 0 }) => {
            const limit = 12;
            const url = new URL('/api/content', window.location.origin);
            url.searchParams.set('page', pageParam.toString());
            url.searchParams.set('limit', limit.toString());
            if (category && category !== 'all') {
                url.searchParams.set('category', category);
            }

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return {
                items: data.items || [],
                nextPage: data.nextPage,
            };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });
}
