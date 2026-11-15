import { cn } from "@/lib/utils";

interface StickyHeaderWrapper extends React.HTMLAttributes<HTMLDivElement> {}

export function StickyHeaderWrapper({
	className,
	children,
	...props
}: StickyHeaderWrapper) {
	return (
		<div
			className={cn(
				"sticky top-(--header-height) z-40 border-b border-(--line) bg-(--header-bg) backdrop-blur-lg backdrop-saturate-150",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
