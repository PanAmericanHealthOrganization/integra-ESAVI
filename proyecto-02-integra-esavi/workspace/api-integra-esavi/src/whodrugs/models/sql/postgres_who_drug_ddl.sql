-- DROP SCHEMA WHO_DRUG;
CREATE SCHEMA WHO_DRUG AUTHORIZATION dhis;

-- DROP TYPE WHO_DRUG.active_ingredients_audit_action_enum;
CREATE TYPE WHO_DRUG.active_ingredients_audit_action_enum AS ENUM ('0', '1', '2', '3');

-- DROP TYPE WHO_DRUG.atomic_therapeutic_chemicals_audit_action_enum;
CREATE TYPE WHO_DRUG.atomic_therapeutic_chemicals_audit_action_enum AS ENUM ('0', '1', '2', '3');

-- DROP TYPE WHO_DRUG.country_sales_audit_action_enum;
CREATE TYPE WHO_DRUG.country_sales_audit_action_enum AS ENUM ('0', '1', '2', '3');

-- DROP TYPE WHO_DRUG.drug_audit_action_enum;
CREATE TYPE WHO_DRUG.drug_audit_action_enum AS ENUM ('0', '1', '2', '3');

-- DROP TYPE WHO_DRUG.drug_sync_audit_action_enum;
CREATE TYPE WHO_DRUG.drug_sync_audit_action_enum AS ENUM ('0', '1', '2', '3');

-- DROP TYPE WHO_DRUG.drug_sync_drs_sync_status_enum;
CREATE TYPE WHO_DRUG.drug_sync_drs_sync_status_enum AS ENUM (
    'STARTED',
    'SYNCHRONIZING',
    'FINISHED',
    'SUCCESS',
    'FAILDED'
);

-- DROP TYPE WHO_DRUG.ingredient_translation_audit_action_enum;
CREATE TYPE WHO_DRUG.ingredient_translation_audit_action_enum AS ENUM ('0', '1', '2', '3');

-- DROP TYPE WHO_DRUG.maholder_audit_action_enum;
CREATE TYPE WHO_DRUG.maholder_audit_action_enum AS ENUM ('0', '1', '2', '3');

-- WHO_DRUG.drug_sync definition
-- Drop table
-- DROP TABLE WHO_DRUG.drug_sync;
CREATE TABLE WHO_DRUG.drug_sync (
    audit_enabled bool DEFAULT true NOT NULL,
    -- Registro habilitado para la cunsulta
    audit_state bool DEFAULT true NOT NULL,
    -- Eliminado lógico, 1 activo, 0 eliminado
    audit_action WHO_DRUG.drug_sync_audit_action_enum DEFAULT '0' :: WHO_DRUG.drug_sync_audit_action_enum NOT NULL,
    -- Última accion CRUD realizada sobre el registro
    audit_created_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de creación del registro
    audit_updated_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de actualización del registro
    id bpchar(11) NOT NULL,
    -- Identificador único del registro
    drs_procces_id varchar(11) NOT NULL,
    drs_sha_256 varchar(258) NOT NULL,
    -- SHA-256 hash del archivo
    drs_start_sync_date timestamp NOT NULL,
    drs_end_sync_date timestamp NULL,
    drs_sync_status WHO_DRUG.drug_sync_drs_sync_status_enum DEFAULT 'STARTED' :: WHO_DRUG.drug_sync_drs_sync_status_enum NOT NULL,
    audit_action_by varchar NULL,
    -- Identificación del usuario o proceso que realiza la acción
    CONSTRAINT "PK_ee106e8e477b55b042054549a55" PRIMARY KEY (id),
    CONSTRAINT "UQ_ee106e8e477b55b042054549a55" UNIQUE (id)
);

-- Column comments
COMMENT ON COLUMN WHO_DRUG.drug_sync.audit_enabled IS 'Registro habilitado para la cunsulta';

COMMENT ON COLUMN WHO_DRUG.drug_sync.audit_state IS 'Eliminado lógico, 1 activo, 0 eliminado';

COMMENT ON COLUMN WHO_DRUG.drug_sync.audit_action IS 'Última accion CRUD realizada sobre el registro';

COMMENT ON COLUMN WHO_DRUG.drug_sync.audit_created_at IS 'Fecha de creación del registro';

COMMENT ON COLUMN WHO_DRUG.drug_sync.audit_updated_at IS 'Fecha de actualización del registro';

COMMENT ON COLUMN WHO_DRUG.drug_sync.id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.drug_sync.drs_sha_256 IS 'SHA-256 hash del archivo';

COMMENT ON COLUMN WHO_DRUG.drug_sync.audit_action_by IS 'Identificación del usuario o proceso que realiza la acción';

-- WHO_DRUG.med_llt definition
-- Drop table
-- DROP TABLE WHO_DRUG.med_llt;
CREATE TABLE WHO_DRUG.med_llt (
    id varchar NOT NULL,
    llt_code varchar NOT NULL,
    llt_name varchar NOT NULL,
    pt_code varchar NOT NULL,
    llt_whoart_code varchar NOT NULL,
    llt_harts_code varchar NOT NULL,
    llt_harts_code2 varchar NOT NULL,
    llt_costart_sym varchar NOT NULL,
    llt_icd9_code varchar NOT NULL,
    llt_icd9cm_code varchar NOT NULL,
    llt_icd10_code varchar NOT NULL,
    llt_currency varchar NOT NULL,
    llt_jart_code varchar NOT NULL,
    CONSTRAINT "PK_0e4d1924a2aff5e38a9ad49f3dd" PRIMARY KEY (id)
);

-- WHO_DRUG.med_pt definition
-- Drop table
-- DROP TABLE WHO_DRUG.med_pt;
CREATE TABLE WHO_DRUG.med_pt (
    id varchar NOT NULL,
    pt_code varchar NOT NULL,
    pt_name varchar NOT NULL,
    pt_field varchar NOT NULL,
    pt_soc_code varchar NOT NULL,
    pt_whoart_code varchar NOT NULL,
    pt_harts_code varchar NOT NULL,
    pt_costart_sym varchar NOT NULL,
    pt_icd9_code varchar NOT NULL,
    pt_icd9cm_code varchar NOT NULL,
    pt_icd10_code varchar NOT NULL,
    pt_jart_cod varchar NOT NULL,
    CONSTRAINT "PK_947d85de21828abcf1aa243fbd8" PRIMARY KEY (id)
);

-- WHO_DRUG.drug definition
-- Drop table
-- DROP TABLE WHO_DRUG.drug;
CREATE TABLE WHO_DRUG.drug (
    audit_enabled bool DEFAULT true NOT NULL,
    -- Registro habilitado para la cunsulta
    audit_state bool DEFAULT true NOT NULL,
    -- Eliminado lógico, 1 activo, 0 eliminado
    audit_action WHO_DRUG.drug_audit_action_enum DEFAULT '0' :: WHO_DRUG.drug_audit_action_enum NOT NULL,
    -- Última accion CRUD realizada sobre el registro
    audit_created_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de creación del registro
    audit_updated_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de actualización del registro
    id bpchar(11) NOT NULL,
    -- Identificador único del registro
    dru_name varchar NOT NULL,
    dru_code varchar NOT NULL,
    dru_medicinal_product_id int4 NOT NULL,
    dru_is_generic bool NOT NULL,
    dru_is_preferred bool NOT NULL,
    drs_id bpchar(11) NULL,
    -- Identificador único del registro
    audit_action_by varchar NULL,
    -- Identificación del usuario o proceso que realiza la acción
    CONSTRAINT "PK_84d53e7c3b5e562421850eb9723" PRIMARY KEY (id),
    CONSTRAINT "UQ_84d53e7c3b5e562421850eb9723" UNIQUE (id),
    CONSTRAINT "FK_4218e02f645245ef75ca09dfd15" FOREIGN KEY (drs_id) REFERENCES WHO_DRUG.drug_sync(id)
);

-- Column comments
COMMENT ON COLUMN WHO_DRUG.drug.audit_enabled IS 'Registro habilitado para la cunsulta';

COMMENT ON COLUMN WHO_DRUG.drug.audit_state IS 'Eliminado lógico, 1 activo, 0 eliminado';

COMMENT ON COLUMN WHO_DRUG.drug.audit_action IS 'Última accion CRUD realizada sobre el registro';

COMMENT ON COLUMN WHO_DRUG.drug.audit_created_at IS 'Fecha de creación del registro';

COMMENT ON COLUMN WHO_DRUG.drug.audit_updated_at IS 'Fecha de actualización del registro';

COMMENT ON COLUMN WHO_DRUG.drug.id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.drug.drs_id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.drug.audit_action_by IS 'Identificación del usuario o proceso que realiza la acción';

-- WHO_DRUG.active_ingredients definition
-- Drop table
-- DROP TABLE WHO_DRUG.active_ingredients;
CREATE TABLE WHO_DRUG.active_ingredients (
    audit_enabled bool DEFAULT true NOT NULL,
    -- Registro habilitado para la cunsulta
    audit_state bool DEFAULT true NOT NULL,
    -- Eliminado lógico, 1 activo, 0 eliminado
    audit_action WHO_DRUG.active_ingredients_audit_action_enum DEFAULT '0' :: WHO_DRUG.active_ingredients_audit_action_enum NOT NULL,
    -- Última accion CRUD realizada sobre el registro
    audit_created_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de creación del registro
    audit_updated_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de actualización del registro
    id bpchar(11) NOT NULL,
    -- Identificador único del registro
    aci_ingredient varchar NULL,
    dru_id bpchar(11) NULL,
    -- Identificador único del registro
    audit_action_by varchar NULL,
    -- Identificación del usuario o proceso que realiza la acción
    CONSTRAINT "PK_ef688d782747982b5c52709d183" PRIMARY KEY (id),
    CONSTRAINT "UQ_ef688d782747982b5c52709d183" UNIQUE (id),
    CONSTRAINT "FK_fb22a7bb1a7e1a250377c844fde" FOREIGN KEY (dru_id) REFERENCES WHO_DRUG.drug(id)
);

-- Column comments
COMMENT ON COLUMN WHO_DRUG.active_ingredients.audit_enabled IS 'Registro habilitado para la cunsulta';

COMMENT ON COLUMN WHO_DRUG.active_ingredients.audit_state IS 'Eliminado lógico, 1 activo, 0 eliminado';

COMMENT ON COLUMN WHO_DRUG.active_ingredients.audit_action IS 'Última accion CRUD realizada sobre el registro';

COMMENT ON COLUMN WHO_DRUG.active_ingredients.audit_created_at IS 'Fecha de creación del registro';

COMMENT ON COLUMN WHO_DRUG.active_ingredients.audit_updated_at IS 'Fecha de actualización del registro';

COMMENT ON COLUMN WHO_DRUG.active_ingredients.id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.active_ingredients.dru_id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.active_ingredients.audit_action_by IS 'Identificación del usuario o proceso que realiza la acción';

-- WHO_DRUG.atomic_therapeutic_chemicals definition
-- Drop table
-- DROP TABLE WHO_DRUG.atomic_therapeutic_chemicals;
CREATE TABLE WHO_DRUG.atomic_therapeutic_chemicals (
    audit_enabled bool DEFAULT true NOT NULL,
    -- Registro habilitado para la cunsulta
    audit_state bool DEFAULT true NOT NULL,
    -- Eliminado lógico, 1 activo, 0 eliminado
    audit_action WHO_DRUG.atomic_therapeutic_chemicals_audit_action_enum DEFAULT '0' :: WHO_DRUG.atomic_therapeutic_chemicals_audit_action_enum NOT NULL,
    -- Última accion CRUD realizada sobre el registro
    audit_created_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de creación del registro
    audit_updated_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de actualización del registro
    id bpchar(11) NOT NULL,
    -- Identificador único del registro
    code varchar NOT NULL,
    -- Código el elemento
    "text" varchar NOT NULL,
    "officialFlag" varchar NOT NULL,
    dru_id bpchar(11) NULL,
    -- Identificador único del registro
    audit_action_by varchar NULL,
    -- Identificación del usuario o proceso que realiza la acción
    CONSTRAINT "PK_2cc251f5b56aefaa1cdec2498cc" PRIMARY KEY (id),
    CONSTRAINT "UQ_2cc251f5b56aefaa1cdec2498cc" UNIQUE (id),
    CONSTRAINT "FK_drug__anatomical_therapeutic_chemical" FOREIGN KEY (dru_id) REFERENCES WHO_DRUG.drug(id)
);

COMMENT ON TABLE WHO_DRUG.atomic_therapeutic_chemicals IS 'Elementos terapeuticos atómicos';

-- Column comments
COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.audit_enabled IS 'Registro habilitado para la cunsulta';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.audit_state IS 'Eliminado lógico, 1 activo, 0 eliminado';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.audit_action IS 'Última accion CRUD realizada sobre el registro';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.audit_created_at IS 'Fecha de creación del registro';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.audit_updated_at IS 'Fecha de actualización del registro';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.code IS 'Código el elemento';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.dru_id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.atomic_therapeutic_chemicals.audit_action_by IS 'Identificación del usuario o proceso que realiza la acción';

-- WHO_DRUG.country_sales definition
-- Drop table
-- DROP TABLE WHO_DRUG.country_sales;
CREATE TABLE WHO_DRUG.country_sales (
    audit_enabled bool DEFAULT true NOT NULL,
    -- Registro habilitado para la cunsulta
    audit_state bool DEFAULT true NOT NULL,
    -- Eliminado lógico, 1 activo, 0 eliminado
    audit_action WHO_DRUG.country_sales_audit_action_enum DEFAULT '0' :: WHO_DRUG.country_sales_audit_action_enum NOT NULL,
    -- Última accion CRUD realizada sobre el registro
    audit_created_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de creación del registro
    audit_updated_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de actualización del registro
    id bpchar(11) NOT NULL,
    -- Identificador único del registro
    cos_country varchar NOT NULL,
    -- Pais en formato ISO iso3Code
    cos_sale int4 NULL,
    -- Porcentaje de venta
    cos_medicinal_product_id int4 NOT NULL,
    -- Identificador del producto medico en el pais
    dru_id bpchar(11) NULL,
    -- Identificador único del registro
    audit_action_by varchar NULL,
    -- Identificación del usuario o proceso que realiza la acción
    CONSTRAINT "PK_5df0f20e39d68550d201003fc8b" PRIMARY KEY (id),
    CONSTRAINT "UQ_5df0f20e39d68550d201003fc8b" UNIQUE (id),
    CONSTRAINT "FK_drug__anatomical_therapeutic_chemical" FOREIGN KEY (dru_id) REFERENCES WHO_DRUG.drug(id)
);

-- Column comments
COMMENT ON COLUMN WHO_DRUG.country_sales.audit_enabled IS 'Registro habilitado para la cunsulta';

COMMENT ON COLUMN WHO_DRUG.country_sales.audit_state IS 'Eliminado lógico, 1 activo, 0 eliminado';

COMMENT ON COLUMN WHO_DRUG.country_sales.audit_action IS 'Última accion CRUD realizada sobre el registro';

COMMENT ON COLUMN WHO_DRUG.country_sales.audit_created_at IS 'Fecha de creación del registro';

COMMENT ON COLUMN WHO_DRUG.country_sales.audit_updated_at IS 'Fecha de actualización del registro';

COMMENT ON COLUMN WHO_DRUG.country_sales.id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.country_sales.cos_country IS 'Pais en formato ISO iso3Code';

COMMENT ON COLUMN WHO_DRUG.country_sales.cos_sale IS 'Porcentaje de venta';

COMMENT ON COLUMN WHO_DRUG.country_sales.cos_medicinal_product_id IS 'Identificador del producto medico en el pais';

COMMENT ON COLUMN WHO_DRUG.country_sales.dru_id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.country_sales.audit_action_by IS 'Identificación del usuario o proceso que realiza la acción';

-- WHO_DRUG.ingredient_translation definition
-- Drop table
-- DROP TABLE WHO_DRUG.ingredient_translation;
CREATE TABLE WHO_DRUG.ingredient_translation (
    audit_enabled bool DEFAULT true NOT NULL,
    -- Registro habilitado para la cunsulta
    audit_state bool DEFAULT true NOT NULL,
    -- Eliminado lógico, 1 activo, 0 eliminado
    audit_action WHO_DRUG.ingredient_translation_audit_action_enum DEFAULT '0' :: WHO_DRUG.ingredient_translation_audit_action_enum NOT NULL,
    -- Última accion CRUD realizada sobre el registro
    audit_created_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de creación del registro
    audit_updated_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de actualización del registro
    id bpchar(11) NOT NULL,
    -- Identificador único del registro
    "int_languageCode" varchar NOT NULL,
    int_ingredient varchar NOT NULL,
    aci_id bpchar(11) NULL,
    -- Identificador único del registro
    audit_action_by varchar NULL,
    -- Identificación del usuario o proceso que realiza la acción
    CONSTRAINT "PK_fdac73d244bac393491a32dc52a" PRIMARY KEY (id),
    CONSTRAINT "UQ_fdac73d244bac393491a32dc52a" UNIQUE (id),
    CONSTRAINT "FK_active_Ingredient__maholder" FOREIGN KEY (aci_id) REFERENCES WHO_DRUG.active_ingredients(id)
);

-- Column comments
COMMENT ON COLUMN WHO_DRUG.ingredient_translation.audit_enabled IS 'Registro habilitado para la cunsulta';

COMMENT ON COLUMN WHO_DRUG.ingredient_translation.audit_state IS 'Eliminado lógico, 1 activo, 0 eliminado';

COMMENT ON COLUMN WHO_DRUG.ingredient_translation.audit_action IS 'Última accion CRUD realizada sobre el registro';

COMMENT ON COLUMN WHO_DRUG.ingredient_translation.audit_created_at IS 'Fecha de creación del registro';

COMMENT ON COLUMN WHO_DRUG.ingredient_translation.audit_updated_at IS 'Fecha de actualización del registro';

COMMENT ON COLUMN WHO_DRUG.ingredient_translation.id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.ingredient_translation.aci_id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.ingredient_translation.audit_action_by IS 'Identificación del usuario o proceso que realiza la acción';

-- WHO_DRUG.maholder definition
-- Drop table
-- DROP TABLE WHO_DRUG.maholder;
CREATE TABLE WHO_DRUG.maholder (
    audit_enabled bool DEFAULT true NOT NULL,
    -- Registro habilitado para la cunsulta
    audit_state bool DEFAULT true NOT NULL,
    -- Eliminado lógico, 1 activo, 0 eliminado
    audit_action WHO_DRUG.maholder_audit_action_enum DEFAULT '0' :: WHO_DRUG.maholder_audit_action_enum NOT NULL,
    -- Última accion CRUD realizada sobre el registro
    audit_created_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de creación del registro
    audit_updated_at timestamp DEFAULT now() NOT NULL,
    -- Fecha de actualización del registro
    id bpchar(11) NOT NULL,
    -- Identificador único del registro
    "name" varchar(512) NOT NULL,
    -- Nombre del titular del registro
    medicinal_product_id int4 NULL,
    -- Código del producto
    cos_id bpchar(11) NULL,
    -- Identificador único del registro
    audit_action_by varchar NULL,
    -- Identificación del usuario o proceso que realiza la acción
    CONSTRAINT "PK_5b5f3796ede65c9fb66d636f74c" PRIMARY KEY (id),
    CONSTRAINT "UQ_5b5f3796ede65c9fb66d636f74c" UNIQUE (id),
    CONSTRAINT "FK_countrySale__maholder" FOREIGN KEY (cos_id) REFERENCES WHO_DRUG.country_sales(id)
);

-- Column comments
COMMENT ON COLUMN WHO_DRUG.maholder.audit_enabled IS 'Registro habilitado para la cunsulta';

COMMENT ON COLUMN WHO_DRUG.maholder.audit_state IS 'Eliminado lógico, 1 activo, 0 eliminado';

COMMENT ON COLUMN WHO_DRUG.maholder.audit_action IS 'Última accion CRUD realizada sobre el registro';

COMMENT ON COLUMN WHO_DRUG.maholder.audit_created_at IS 'Fecha de creación del registro';

COMMENT ON COLUMN WHO_DRUG.maholder.audit_updated_at IS 'Fecha de actualización del registro';

COMMENT ON COLUMN WHO_DRUG.maholder.id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.maholder."name" IS 'Nombre del titular del registro';

COMMENT ON COLUMN WHO_DRUG.maholder.medicinal_product_id IS 'Código del producto';

COMMENT ON COLUMN WHO_DRUG.maholder.cos_id IS 'Identificador único del registro';

COMMENT ON COLUMN WHO_DRUG.maholder.audit_action_by IS 'Identificación del usuario o proceso que realiza la acción';