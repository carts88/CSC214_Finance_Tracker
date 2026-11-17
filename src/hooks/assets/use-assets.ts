import {
	type QueryClient,
	skipToken,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	AssetValues,
	SellAssetValues,
} from "#/database/assets/schemas.assets";
import { addAssetFn } from "#/database/assets/server-fn/add-asset";
import { getAssetsFn } from "#/database/assets/server-fn/get-assets";
import { removeAssetFn } from "#/database/assets/server-fn/remove-asset";
import { removeAssetsFn } from "#/database/assets/server-fn/remove-assets";
import { sellAssetFn } from "#/database/assets/server-fn/sell-asset";
import { dashboardKeys } from "#/hooks/dashboard/use-dashboard";
import { incomeKeys } from "#/hooks/incomes/use-incomes";

export const assetKeys = {
	list: (accountId: string) => ["assets", accountId] as const,
};

/**
 * Refetches the account's asset list and its dashboard (which shows the
 * asset total and net worth). Called after every asset mutation.
 */
function invalidateAssets(queryClient: QueryClient, accountId: string) {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: assetKeys.list(accountId) }),
		queryClient.invalidateQueries({ queryKey: dashboardKeys.all(accountId) }),
	]);
}

/** All assets on a finance account. Idle until `accountId` is set. */
export function useAssets(accountId: string | undefined) {
	return useQuery({
		queryKey: assetKeys.list(accountId ?? ""),
		queryFn: accountId ? () => getAssetsFn({ data: { accountId } }) : skipToken,
	});
}

/**
 * Creates an asset, or updates one when `assetId` is passed. Refetches the
 * account's asset list afterwards.
 */
export function useSaveAsset(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: AssetValues & { assetId?: string }) =>
			addAssetFn({ data: { ...values, accountId } }),
		onSettled: () => invalidateAssets(queryClient, accountId),
	});
}

/** Deletes an asset, then refetches. */
export function useRemoveAsset(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (assetId: string) =>
			removeAssetFn({ data: { accountId, assetId } }),
		onSettled: () => invalidateAssets(queryClient, accountId),
	});
}

/** Deletes several assets at once, then refetches. */
export function useRemoveAssets(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (assetIds: string[]) =>
			removeAssetsFn({ data: { accountId, assetIds } }),
		onSettled: () => invalidateAssets(queryClient, accountId),
	});
}

/**
 * Sells an asset (records the sale as income and removes the asset), then
 * refetches assets, incomes and the dashboard.
 */
export function useSellAsset(accountId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (values: SellAssetValues & { assetId: string }) =>
			sellAssetFn({ data: { ...values, accountId } }),
		onSettled: () =>
			Promise.all([
				invalidateAssets(queryClient, accountId),
				queryClient.invalidateQueries({ queryKey: incomeKeys.list(accountId) }),
			]),
	});
}
