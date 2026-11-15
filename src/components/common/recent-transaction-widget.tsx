interface IRecentTransactionWidget {
    data: any[]
}

export const RecentTransactionWidget = ({
    data
} :  IRecentTransactionWidget) => {
    
    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <p className="text-sm text-muted-foreground">Your most recent transactions.</p>
        </div>
    )
}