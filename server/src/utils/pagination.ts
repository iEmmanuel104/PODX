export interface IPaging {
    count?: number;
    page: number | null;
    limit: number | null;
    size: number | null;
}

export default class Pagination {
    static getPagination = ({ page, size }: IPaging): { limit: number | null; offset: number | null } => {
        const limit = size ?? null;
        let offset = null;

        if (limit !== null) {
            offset = (page && page > 1) ? (page - 1) * limit : 0;
        }

        return { limit, offset };
    };

    static estimateTotalPage = ({ count, limit }: IPaging): { totalPages: number } => {
        const pageCount = count as number;
        const totalPages = limit ? Math.ceil(pageCount / limit) : 1;
        return { totalPages };
    };
}
