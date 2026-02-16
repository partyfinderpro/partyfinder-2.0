// Force dynamic rendering to avoid prerendering errors with useSearchParams
export const dynamic = 'force-dynamic';

export default function FeedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
