import { Link, useMatchRoute } from "@tanstack/react-router";
import { Boxes, ListTodo, LogOut } from "lucide-react";
import type { ComponentProps } from "react";
import { toast } from "sonner";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "../auth/sessionContext";

const NAV_ITEMS = [
	{ title: "Queue", to: "/", icon: ListTodo },
	{ title: "Inventory", to: "/inventory", icon: Boxes },
] as const;

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
	const matchRoute = useMatchRoute();
	const session = useSession();

	async function handleSignOut() {
		const { error } = await supabase.auth.signOut({ scope: "local" });
		if (error) {
			toast.error("Couldn't sign out. Try again.");
		}
	}

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<span className="px-2 py-1 font-semibold">FRC 5507 Parts</span>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										isActive={Boolean(matchRoute({ to: item.to }))}
										render={<Link to={item.to} />}
									>
										<item.icon />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={handleSignOut}>
							<LogOut />
							<p className="truncate px-2 text-xs text-muted-foreground">
								{session.user.email}
							</p>
							<span>Sign out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
