import { getSafeRedirectTo } from '@better-auth-ui/core'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '#/components/auth/auth-provider'
import { AppSidebar } from '#/components/navigation/app-sidebar'
import { NAV_ITEMS } from '#/components/navigation/navigation-config'
import { Separator } from '#/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { Toaster } from '#/components/ui/sonner'
import { TooltipProvider } from '#/components/ui/tooltip'
import { authClient } from '#/lib/auth-client'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showSidebar = !pathname.startsWith('/auth')
  const pageTitle =
    NAV_ITEMS.find(({ to }) =>
      to === '/' ? pathname === '/' : pathname.startsWith(to ?? ''),
    )?.label ?? (pathname.startsWith('/settings') ? 'Settings' : '')
  return (
    // next-themes sets the `dark` class on <html> before hydration, so React must not warn about it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* QueryClientProvider is supplied by setupRouterSsrQueryIntegration in router.tsx */}
          <AuthProvider
            authClient={authClient}
            emailAndPassword={{ requireEmailVerification: false }} // matches the branch's "Verify email at signup" (off)
            navigate={({ to, replace }) => {
              const path = getSafeRedirectTo(to, window.location.origin)
              const target = path.startsWith('//') ? '/' : path
              void router.navigate({ href: target, replace })
            }}
            Link={RouterLink}
            redirectTo="/"
          >
            <TooltipProvider>
              {showSidebar ? (
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                      <SidebarTrigger className="-ml-1" />
                      <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                      />
                      <span className="text-sm font-medium">{pageTitle}</span>
                    </header>
                    <div className="flex-1">{children}</div>
                  </SidebarInset>
                </SidebarProvider>
              ) : (
                children
              )}
            </TooltipProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

// Better Auth UI passes an href with a query string, which `to` doesn't parse.
function RouterLink({
  href,
  to: _to,
  ...props
}: { href: string; to?: string } & Omit<ComponentProps<'a'>, 'href'>) {
  const url = new URL(href, 'http://local')
  return (
    <Link
      to={url.pathname}
      search={Object.fromEntries(url.searchParams)}
      hash={url.hash.slice(1)}
      {...props}
    />
  )
}
