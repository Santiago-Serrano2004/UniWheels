#!/bin/bash
set -e
set -u

# Cada microservicio recibe su PROPIO rol de PostgreSQL, con privilegios únicamente
# sobre su propia base de datos. Antes, los 5 servicios compartían el rol
# 'uniwheels_user' con GRANT ALL PRIVILEGES sobre las 5 bases — comprometer la
# credencial de un solo servicio exponía las 5. Las contraseñas por servicio se
# generan aquí y deben copiarse a DB_PASSWORD en el .env de cada microservicio
# (ver salida al final de este script).

declare -A DB_ROLE_PASSWORDS=(
	["auth_db"]="auth_service_role"
	["vehicle_db"]="vehicle_service_role"
	["route_gis_db"]="route_matching_service_role"
	["trip_db"]="trip_service_role"
	["notification_db"]="notification_service_role"
)

function create_database_and_role() {
	local database=$1
	local role=$2
	local password
	password=$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')

	echo "Creating database '$database' and role '$role'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE DATABASE $database;
	    CREATE ROLE $role WITH LOGIN PASSWORD '$password';
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $role;
EOSQL

	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "$database" <<-EOSQL
	    GRANT ALL ON SCHEMA public TO $role;
EOSQL

	echo "  -> DB_USERNAME=$role"
	echo "  -> DB_PASSWORD=$password"
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
		role="${DB_ROLE_PASSWORDS[$db]:-${db}_role}"
		create_database_and_role "$db" "$role"
	done
	echo "Enabling PostGIS extension on route_gis_db..."
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d route_gis_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
	# El rol de route-matching-service necesita poder crear los tipos/índices GiST de PostGIS.
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d route_gis_db -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO route_matching_service_role;"
	echo "Multiple databases and PostGIS created successfully! Copia cada DB_USERNAME/DB_PASSWORD impreso arriba al .env del servicio correspondiente."
fi
