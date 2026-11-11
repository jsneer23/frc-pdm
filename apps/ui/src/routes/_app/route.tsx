import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/app-shell/AppSidebar";
import { AuthGate } from "@/features/auth/AuthGate";

export const Route = createFileRoute("/_app")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<AuthGate>
				<SidebarProvider>
					<AppSidebar variant="inset" />
					<SidebarInset>
						<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
							<SidebarTrigger className="-ml-1" />
							<h1 className="text-sm font-medium">Queue</h1>
						</header>
						<div className="flex flex-1 flex-col p-4 lg:p-6">
							<Outlet />
						</div>
					</SidebarInset>
				</SidebarProvider>
			</AuthGate>
		</div>
	);
}
