import { useRouter } from "next/navigation";
import { useCallback } from "react";


export function useNavigate() {
    const router = useRouter();

    const navigatetoRoute = useCallback((path:string, option?: {replace?: boolean})=>{
        if (option?.replace) {
            return router.replace(path);
        }

        return router.push(path);
    }, [router]);

    return navigatetoRoute;
}