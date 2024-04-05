const isBrowser = typeof window !== 'undefined';

const env = isBrowser ? (import.meta as any).env : process.env;

const isMysql = env.UFO_DB_ENGINE === 'mysql';

export type ConfigType = {
  flags: {[key: string]: boolean },
  locale: string,
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    engine: 'mysql' | 'postgis';
  },
  api: {
    port: number;
    host: string;
    endopoints: {
      search: string;
      details: string;
    };
    searchableTextColumnNames: string[];
    debug: boolean;
  };
  gui: {
    time_window_ms: number;
    debounce: number;
    apiRequests: {
      debounceMs: number;
    };
    map: {
      centre: [number, number];
      cluster_eps_metres: number;
      initZoom: number;
      zoomLevelForPoints: number;
      zoomLevelForPointDetails: number;
    };
  };
  minQLength: number;
};

const config: ConfigType = {
  locale: 'no',
  db: {
    host: env.PGHOST || 'localhost',
    port: parseInt(env.PGPORT || '5432'),
    user: env.PGUSER || 'postgres',
    password: env.PGPASSWORD || 'password',
    database: env.SENSOR_DB_NAME || 'sensors',
    engine: 'postgis'
  },
  api: {
    port: parseInt(env.UFO_HTTP_PORT || '8080'),
    host: env.UFO_HTTP_HOST || 'http://localhost',
    endopoints: {
      search: '/search',
      details: '/details'
    },
    searchableTextColumnNames: ['location_text', 'report_text'],
    debug: true,
  },
  gui: {
    debounce: 500,
    apiRequests: {
      debounceMs: 1000,
    },
    map: {
      centre: [10.59, 62.25] as [number, number], 
      cluster_eps_metres: 50000, // The distance between clusters
      initZoom: 10,
      zoomLevelForPoints: 8,
      zoomLevelForPointDetails: 11,
    },
    time_window_ms: 1000 * 60 * 12, // 12 hours
  },
  minQLength: 3,
  flags: {
    USE_BOUNDS_WITHOUT_PANEL: false,
  },
};

if (isMysql) {
  config.db.host = env.MYSQL_HOST || 'localhost';
  config.db.port = parseInt(env.MYSQL_PORT || '5432');
  config.db.user = env.MYSQL_USER || env.MYSQL_USERNAME || 'root';
  config.db.password = env.MYSQL_PASSWORD || 'password';
  config.db.engine = 'mysql';
}

export default config;
