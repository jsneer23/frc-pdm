import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { submitPartRequest } from "./api";

export function useSubmitPartRequest() {
	return useMutation({
		mutationFn: submitPartRequest,
		onSuccess: (data) => {
			const partNumber = data?.partNumber;
			if (typeof partNumber === "string") {
				toast.success(`Part ${partNumber} created`, {
					duration: 10000,
					action: {
						label: "Copy",
						onClick: () =>
							navigator.clipboard
								.writeText(partNumber)
								.then(() => toast.success("Copied"))
								.catch(() =>
									toast.error("Couldn't copy. Select the number and press ⌘C."),
								),
					},
				});
				if (data?.warning) {
					toast.warning(data.warning);
				}
			} else {
				toast.warning(
					data?.warning ?? "Part created, but its number couldn't be shown.",
				);
			}
			if (import.meta.env.DEV) {
				console.log(data);
			}
		},
		onError: (error) => {
			console.error(error);
			toast.error(error.message);
		},
	});
}
