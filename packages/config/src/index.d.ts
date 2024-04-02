declare const config: {
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    api: {
        port: number;
        host: string;
        endopoint: {
            search: string;
        };
    };
};
export default config;
