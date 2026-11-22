--
-- PostgreSQL database dump
--

\restrict GUaRsPZ8gBlMX0TIard2fpsGvK2K9nabY2AzEW3z1lb7FUCacosfaKyl09Z1iVV

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccionCalidadLote; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccionCalidadLote" AS ENUM (
    'CAMBIO_ESTADO'
);


--
-- Name: AccionHistorialOrdenPago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccionHistorialOrdenPago" AS ENUM (
    'CREACION',
    'APROBACION',
    'RECHAZO',
    'REGISTRO_DESEMBOLSO'
);


--
-- Name: EstadoCalidadLote; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoCalidadLote" AS ENUM (
    'DISPONIBLE',
    'CUARENTENA',
    'BLOQUEADO'
);


--
-- Name: EstadoCotizacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoCotizacion" AS ENUM (
    'BORRADOR',
    'EMITIDA',
    'ACEPTADA',
    'RECHAZADA',
    'VENCIDA',
    'ANULADA'
);


--
-- Name: EstadoDespacho; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoDespacho" AS ENUM (
    'PENDIENTE',
    'EN_RUTA',
    'ENTREGADO',
    'REPROGRAMADO'
);


--
-- Name: EstadoOrdenPago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoOrdenPago" AS ENUM (
    'SOLICITADA',
    'APROBADA',
    'RECHAZADA',
    'PAGO_PARCIAL',
    'PAGADA'
);


--
-- Name: EstadoRelacionComercial; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoRelacionComercial" AS ENUM (
    'PROSPECTO',
    'CALIFICADO',
    'DESCARTADO'
);


--
-- Name: EstadoRetencionLote; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoRetencionLote" AS ENUM (
    'ACTIVA',
    'LIBERADA'
);


--
-- Name: EstadoUsuario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoUsuario" AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'BLOQUEADO'
);


--
-- Name: EstadoVenta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoVenta" AS ENUM (
    'CONFIRMADA',
    'EN_PREPARACION',
    'DESPACHADA',
    'COMPLETADA',
    'ANULADA'
);


--
-- Name: EtapaOportunidad; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EtapaOportunidad" AS ENUM (
    'PROSPECTO',
    'CONTACTADO',
    'COTIZACION',
    'NEGOCIACION',
    'GANADA',
    'PERDIDA'
);


--
-- Name: MetodoDesembolso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetodoDesembolso" AS ENUM (
    'TRANSFERENCIA',
    'EFECTIVO',
    'CHEQUE',
    'OTRO'
);


--
-- Name: MetodoPago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetodoPago" AS ENUM (
    'EFECTIVO',
    'TRANSFERENCIA',
    'TARJETA',
    'CREDITO'
);


--
-- Name: Moneda; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Moneda" AS ENUM (
    'PEN',
    'USD'
);


--
-- Name: ResultadoActividadComercial; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ResultadoActividadComercial" AS ENUM (
    'CONTACTO_EFECTIVO',
    'SIN_RESPUESTA',
    'REPROGRAMADO',
    'SIN_INTERES',
    'CALIFICADO'
);


--
-- Name: RolUsuario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RolUsuario" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'COMERCIAL',
    'COMPRAS',
    'ALMACEN',
    'CONDUCTOR'
);


--
-- Name: TipoActividadComercial; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoActividadComercial" AS ENUM (
    'LLAMADA',
    'WHATSAPP',
    'CORREO',
    'VISITA',
    'OTRO',
    'CALIFICACION'
);


--
-- Name: TipoMovimiento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoMovimiento" AS ENUM (
    'ENTRADA_COMPRA',
    'SALIDA_VENTA',
    'AJUSTE_POSITIVO',
    'AJUSTE_NEGATIVO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActividadComercial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ActividadComercial" (
    id integer NOT NULL,
    "oportunidadId" integer NOT NULL,
    "usuarioId" integer NOT NULL,
    tipo public."TipoActividadComercial" NOT NULL,
    resultado public."ResultadoActividadComercial" NOT NULL,
    "personaContacto" character varying(120),
    observaciones text NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ActividadComercial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ActividadComercial_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ActividadComercial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ActividadComercial_id_seq" OWNED BY public."ActividadComercial".id;


--
-- Name: AsignacionLoteVenta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AsignacionLoteVenta" (
    id integer NOT NULL,
    "detalleVentaId" integer NOT NULL,
    "loteId" integer NOT NULL,
    cantidad integer NOT NULL,
    "fechaAsignacion" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AsignacionLoteVenta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AsignacionLoteVenta_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AsignacionLoteVenta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AsignacionLoteVenta_id_seq" OWNED BY public."AsignacionLoteVenta".id;


--
-- Name: Categoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Categoria" (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


--
-- Name: Categoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Categoria_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Categoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Categoria_id_seq" OWNED BY public."Categoria".id;


--
-- Name: Cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cliente" (
    id integer NOT NULL,
    "razonSocial" text NOT NULL,
    documento text,
    telefono text,
    correo text,
    direccion text,
    estado boolean DEFAULT true NOT NULL,
    "estadoRelacionComercial" public."EstadoRelacionComercial" DEFAULT 'PROSPECTO'::public."EstadoRelacionComercial" NOT NULL,
    "fechaCalificacion" timestamp(3) without time zone
);


--
-- Name: Cliente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Cliente_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Cliente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Cliente_id_seq" OWNED BY public."Cliente".id;


--
-- Name: Compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Compra" (
    id integer NOT NULL,
    "proveedorId" integer NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "importeTotal" numeric(12,2) NOT NULL,
    estado text DEFAULT 'COMPLETADO'::text NOT NULL,
    moneda public."Moneda" DEFAULT 'PEN'::public."Moneda" NOT NULL,
    "tipoCambio" numeric(12,6),
    "fechaEntregaEstimada" timestamp(3) without time zone,
    observaciones text
);


--
-- Name: Compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Compra_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Compra_id_seq" OWNED BY public."Compra".id;


--
-- Name: Cotizacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cotizacion" (
    id integer NOT NULL,
    "oportunidadId" integer,
    "clienteId" integer NOT NULL,
    "vendedorId" integer NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validezHasta" timestamp(3) without time zone,
    estado public."EstadoCotizacion" DEFAULT 'BORRADOR'::public."EstadoCotizacion" NOT NULL,
    moneda public."Moneda" DEFAULT 'PEN'::public."Moneda" NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    descuento numeric(12,2) DEFAULT 0 NOT NULL,
    "importeTotal" numeric(12,2) NOT NULL,
    observaciones text,
    "condicionPago" character varying(100),
    "plazoEntrega" character varying(150),
    "cotizacionAnteriorId" integer,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: Cotizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Cotizacion_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Cotizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Cotizacion_id_seq" OWNED BY public."Cotizacion".id;


--
-- Name: DesembolsoPago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DesembolsoPago" (
    id integer NOT NULL,
    "ordenPagoId" integer NOT NULL,
    "responsableId" integer NOT NULL,
    monto numeric(12,2) NOT NULL,
    metodo public."MetodoDesembolso" NOT NULL,
    referencia character varying(150),
    observaciones text,
    "fechaPago" timestamp(3) without time zone NOT NULL,
    "fechaRegistro" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "claveIdempotencia" character varying(36)
);


--
-- Name: DesembolsoPago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DesembolsoPago_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DesembolsoPago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DesembolsoPago_id_seq" OWNED BY public."DesembolsoPago".id;


--
-- Name: Despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Despacho" (
    id integer NOT NULL,
    "hojaRutaId" integer,
    "ventaId" integer NOT NULL,
    estado public."EstadoDespacho" DEFAULT 'PENDIENTE'::public."EstadoDespacho" NOT NULL,
    observacion text,
    "fechaActualizacion" timestamp(3) without time zone NOT NULL,
    "fechaCreacion" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Despacho_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Despacho_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Despacho_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Despacho_id_seq" OWNED BY public."Despacho".id;


--
-- Name: DetalleCompra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DetalleCompra" (
    id integer NOT NULL,
    "compraId" integer NOT NULL,
    "productoId" integer NOT NULL,
    cantidad integer NOT NULL,
    "precioUnitario" numeric(12,2) NOT NULL,
    "numeroLote" text,
    "fechaVencimiento" timestamp(3) without time zone
);


--
-- Name: DetalleCompra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DetalleCompra_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DetalleCompra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DetalleCompra_id_seq" OWNED BY public."DetalleCompra".id;


--
-- Name: DetalleCotizacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DetalleCotizacion" (
    id integer NOT NULL,
    "cotizacionId" integer NOT NULL,
    "productoId" integer NOT NULL,
    cantidad integer NOT NULL,
    "precioUnitario" numeric(12,2) NOT NULL,
    descuento numeric(12,2) DEFAULT 0 NOT NULL
);


--
-- Name: DetalleCotizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DetalleCotizacion_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DetalleCotizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DetalleCotizacion_id_seq" OWNED BY public."DetalleCotizacion".id;


--
-- Name: DetalleDespacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DetalleDespacho" (
    id integer NOT NULL,
    "despachoId" integer NOT NULL,
    "asignacionLoteVentaId" integer NOT NULL,
    cantidad integer NOT NULL
);


--
-- Name: DetalleDespacho_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DetalleDespacho_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DetalleDespacho_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DetalleDespacho_id_seq" OWNED BY public."DetalleDespacho".id;


--
-- Name: DetalleVenta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DetalleVenta" (
    id integer NOT NULL,
    "ventaId" integer NOT NULL,
    "productoId" integer NOT NULL,
    cantidad integer NOT NULL,
    "precioUnitario" numeric(12,2) NOT NULL,
    descuento numeric(12,2) DEFAULT 0.0 NOT NULL
);


--
-- Name: DetalleVenta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DetalleVenta_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DetalleVenta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DetalleVenta_id_seq" OWNED BY public."DetalleVenta".id;


--
-- Name: Gasto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Gasto" (
    id integer NOT NULL,
    "tipoGasto" text NOT NULL,
    descripcion text,
    monto numeric(12,2) NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "responsableId" integer NOT NULL,
    "medioPago" public."MetodoPago" NOT NULL
);


--
-- Name: Gasto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Gasto_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Gasto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Gasto_id_seq" OWNED BY public."Gasto".id;


--
-- Name: HistorialCalidadLote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HistorialCalidadLote" (
    id integer NOT NULL,
    "loteId" integer NOT NULL,
    "usuarioId" integer NOT NULL,
    accion public."AccionCalidadLote" DEFAULT 'CAMBIO_ESTADO'::public."AccionCalidadLote" NOT NULL,
    "estadoAnterior" public."EstadoCalidadLote" NOT NULL,
    "estadoNuevo" public."EstadoCalidadLote" NOT NULL,
    motivo character varying(500) NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: HistorialCalidadLote_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."HistorialCalidadLote_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: HistorialCalidadLote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."HistorialCalidadLote_id_seq" OWNED BY public."HistorialCalidadLote".id;


--
-- Name: HistorialOportunidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HistorialOportunidad" (
    id integer NOT NULL,
    "oportunidadId" integer NOT NULL,
    "usuarioId" integer NOT NULL,
    "etapaAnterior" public."EtapaOportunidad",
    "etapaNueva" public."EtapaOportunidad" NOT NULL,
    comentario text,
    "fechaCambio" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: HistorialOportunidad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."HistorialOportunidad_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: HistorialOportunidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."HistorialOportunidad_id_seq" OWNED BY public."HistorialOportunidad".id;


--
-- Name: HistorialOrdenPago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HistorialOrdenPago" (
    id integer NOT NULL,
    "ordenPagoId" integer NOT NULL,
    "usuarioId" integer NOT NULL,
    accion public."AccionHistorialOrdenPago" NOT NULL,
    "estadoAnterior" public."EstadoOrdenPago",
    "estadoNuevo" public."EstadoOrdenPago" NOT NULL,
    descripcion text,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: HistorialOrdenPago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."HistorialOrdenPago_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: HistorialOrdenPago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."HistorialOrdenPago_id_seq" OWNED BY public."HistorialOrdenPago".id;


--
-- Name: HojaRuta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HojaRuta" (
    id integer NOT NULL,
    "conductorId" integer NOT NULL,
    "vehiculoId" integer NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado text DEFAULT 'ASIGNADO'::text NOT NULL
);


--
-- Name: HojaRuta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."HojaRuta_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: HojaRuta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."HojaRuta_id_seq" OWNED BY public."HojaRuta".id;


--
-- Name: Lote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lote" (
    id integer NOT NULL,
    "numeroLote" text NOT NULL,
    "productoId" integer NOT NULL,
    "cantidadInicial" integer NOT NULL,
    "cantidadDisponible" integer NOT NULL,
    "fechaIngreso" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fechaVencimiento" timestamp(3) without time zone NOT NULL,
    "estadoCalidad" public."EstadoCalidadLote" DEFAULT 'DISPONIBLE'::public."EstadoCalidadLote" NOT NULL
);


--
-- Name: Lote_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Lote_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Lote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Lote_id_seq" OWNED BY public."Lote".id;


--
-- Name: MovimientoInventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MovimientoInventario" (
    id integer NOT NULL,
    "productoId" integer NOT NULL,
    "loteId" integer,
    tipo public."TipoMovimiento" NOT NULL,
    cantidad integer NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motivo text,
    "usuarioId" integer
);


--
-- Name: MovimientoInventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MovimientoInventario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MovimientoInventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MovimientoInventario_id_seq" OWNED BY public."MovimientoInventario".id;


--
-- Name: OportunidadComercial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OportunidadComercial" (
    id integer NOT NULL,
    titulo character varying(180) NOT NULL,
    "clienteId" integer NOT NULL,
    "vendedorId" integer NOT NULL,
    etapa public."EtapaOportunidad" DEFAULT 'PROSPECTO'::public."EtapaOportunidad" NOT NULL,
    "montoEstimado" numeric(12,2),
    moneda public."Moneda" DEFAULT 'PEN'::public."Moneda" NOT NULL,
    descripcion text,
    "proximaActividad" character varying(300),
    "fechaSeguimiento" timestamp(3) without time zone,
    "motivoPerdida" text,
    "fechaCreacion" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fechaActualizacion" timestamp(3) without time zone NOT NULL,
    "fechaCierre" timestamp(3) without time zone
);


--
-- Name: OportunidadComercial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OportunidadComercial_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OportunidadComercial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OportunidadComercial_id_seq" OWNED BY public."OportunidadComercial".id;


--
-- Name: OrdenPago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrdenPago" (
    id integer NOT NULL,
    "compraId" integer NOT NULL,
    "solicitanteId" integer NOT NULL,
    "autorizadorId" integer,
    estado public."EstadoOrdenPago" DEFAULT 'SOLICITADA'::public."EstadoOrdenPago" NOT NULL,
    "montoSolicitado" numeric(12,2) NOT NULL,
    moneda public."Moneda" NOT NULL,
    "numeroFactura" character varying(100),
    observaciones text,
    "motivoRechazo" text,
    "fechaSolicitud" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "fechaAutorizacion" timestamp(3) without time zone,
    "fechaActualizacion" timestamp(3) without time zone NOT NULL
);


--
-- Name: OrdenPago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OrdenPago_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OrdenPago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OrdenPago_id_seq" OWNED BY public."OrdenPago".id;


--
-- Name: Pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Pago" (
    id integer NOT NULL,
    "ventaId" integer NOT NULL,
    monto numeric(12,2) NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "metodoPago" public."MetodoPago" NOT NULL,
    "claveOperacion" uuid,
    referencia character varying(120),
    "registradoPorId" integer
);


--
-- Name: Pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Pago_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Pago_id_seq" OWNED BY public."Pago".id;


--
-- Name: Producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Producto" (
    id integer NOT NULL,
    nombre text NOT NULL,
    "categoriaId" integer NOT NULL,
    codigo text NOT NULL,
    descripcion text,
    estado boolean DEFAULT true NOT NULL,
    "precioCompra" numeric(12,2) DEFAULT 0.0 NOT NULL,
    "precioVenta" numeric(12,2) DEFAULT 0.0 NOT NULL,
    "stockMinimo" integer DEFAULT 0 NOT NULL,
    "unidadMedida" text NOT NULL,
    moneda public."Moneda" DEFAULT 'PEN'::public."Moneda" NOT NULL,
    "stockActual" integer DEFAULT 0 NOT NULL
);


--
-- Name: Producto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Producto_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Producto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Producto_id_seq" OWNED BY public."Producto".id;


--
-- Name: Proveedor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Proveedor" (
    id integer NOT NULL,
    "razonSocial" text NOT NULL,
    ruc text NOT NULL,
    contacto text,
    telefono text,
    correo text,
    direccion text,
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: Proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Proveedor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Proveedor_id_seq" OWNED BY public."Proveedor".id;


--
-- Name: RecepcionCompra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RecepcionCompra" (
    id integer NOT NULL,
    "compraId" integer NOT NULL,
    "detalleCompraId" integer NOT NULL,
    "loteId" integer NOT NULL,
    "usuarioId" integer,
    cantidad integer NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "RecepcionCompra_cantidad_check" CHECK ((cantidad > 0))
);


--
-- Name: RecepcionCompra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RecepcionCompra_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RecepcionCompra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RecepcionCompra_id_seq" OWNED BY public."RecepcionCompra".id;


--
-- Name: RetencionLote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RetencionLote" (
    id integer NOT NULL,
    "loteId" integer NOT NULL,
    cantidad integer NOT NULL,
    motivo character varying(500) NOT NULL,
    estado public."EstadoRetencionLote" DEFAULT 'ACTIVA'::public."EstadoRetencionLote" NOT NULL,
    "registradoPorId" integer NOT NULL,
    "fechaRegistro" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "liberadoPorId" integer,
    "fechaLiberacion" timestamp(3) without time zone,
    "motivoLiberacion" character varying(500)
);


--
-- Name: RetencionLote_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RetencionLote_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RetencionLote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RetencionLote_id_seq" OWNED BY public."RetencionLote".id;


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Usuario" (
    id integer NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    nombre text NOT NULL,
    rol public."RolUsuario" NOT NULL,
    estado public."EstadoUsuario" DEFAULT 'ACTIVO'::public."EstadoUsuario" NOT NULL,
    "intentosFallidos" integer DEFAULT 0 NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL
);


--
-- Name: Usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Usuario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Usuario_id_seq" OWNED BY public."Usuario".id;


--
-- Name: Vehiculo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vehiculo" (
    id integer NOT NULL,
    placa text NOT NULL,
    modelo text NOT NULL,
    capacidad text NOT NULL,
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: Vehiculo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Vehiculo_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Vehiculo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Vehiculo_id_seq" OWNED BY public."Vehiculo".id;


--
-- Name: Venta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Venta" (
    id integer NOT NULL,
    "clienteId" integer NOT NULL,
    "vendedorId" integer NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal numeric(12,2) DEFAULT 0.0 NOT NULL,
    descuento numeric(12,2) DEFAULT 0.0 NOT NULL,
    "importeTotal" numeric(12,2) NOT NULL,
    "metodoPago" public."MetodoPago",
    "saldoPendiente" numeric(12,2) DEFAULT 0.0 NOT NULL,
    "cotizacionId" integer,
    estado public."EstadoVenta" DEFAULT 'CONFIRMADA'::public."EstadoVenta" NOT NULL,
    moneda public."Moneda" DEFAULT 'PEN'::public."Moneda" NOT NULL,
    "oportunidadId" integer
);


--
-- Name: Venta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Venta_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Venta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Venta_id_seq" OWNED BY public."Venta".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: ActividadComercial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActividadComercial" ALTER COLUMN id SET DEFAULT nextval('public."ActividadComercial_id_seq"'::regclass);


--
-- Name: AsignacionLoteVenta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AsignacionLoteVenta" ALTER COLUMN id SET DEFAULT nextval('public."AsignacionLoteVenta_id_seq"'::regclass);


--
-- Name: Categoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categoria" ALTER COLUMN id SET DEFAULT nextval('public."Categoria_id_seq"'::regclass);


--
-- Name: Cliente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cliente" ALTER COLUMN id SET DEFAULT nextval('public."Cliente_id_seq"'::regclass);


--
-- Name: Compra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Compra" ALTER COLUMN id SET DEFAULT nextval('public."Compra_id_seq"'::regclass);


--
-- Name: Cotizacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cotizacion" ALTER COLUMN id SET DEFAULT nextval('public."Cotizacion_id_seq"'::regclass);


--
-- Name: DesembolsoPago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DesembolsoPago" ALTER COLUMN id SET DEFAULT nextval('public."DesembolsoPago_id_seq"'::regclass);


--
-- Name: Despacho id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Despacho" ALTER COLUMN id SET DEFAULT nextval('public."Despacho_id_seq"'::regclass);


--
-- Name: DetalleCompra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCompra" ALTER COLUMN id SET DEFAULT nextval('public."DetalleCompra_id_seq"'::regclass);


--
-- Name: DetalleCotizacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCotizacion" ALTER COLUMN id SET DEFAULT nextval('public."DetalleCotizacion_id_seq"'::regclass);


--
-- Name: DetalleDespacho id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleDespacho" ALTER COLUMN id SET DEFAULT nextval('public."DetalleDespacho_id_seq"'::regclass);


--
-- Name: DetalleVenta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleVenta" ALTER COLUMN id SET DEFAULT nextval('public."DetalleVenta_id_seq"'::regclass);


--
-- Name: Gasto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Gasto" ALTER COLUMN id SET DEFAULT nextval('public."Gasto_id_seq"'::regclass);


--
-- Name: HistorialCalidadLote id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialCalidadLote" ALTER COLUMN id SET DEFAULT nextval('public."HistorialCalidadLote_id_seq"'::regclass);


--
-- Name: HistorialOportunidad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOportunidad" ALTER COLUMN id SET DEFAULT nextval('public."HistorialOportunidad_id_seq"'::regclass);


--
-- Name: HistorialOrdenPago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOrdenPago" ALTER COLUMN id SET DEFAULT nextval('public."HistorialOrdenPago_id_seq"'::regclass);


--
-- Name: HojaRuta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HojaRuta" ALTER COLUMN id SET DEFAULT nextval('public."HojaRuta_id_seq"'::regclass);


--
-- Name: Lote id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lote" ALTER COLUMN id SET DEFAULT nextval('public."Lote_id_seq"'::regclass);


--
-- Name: MovimientoInventario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MovimientoInventario" ALTER COLUMN id SET DEFAULT nextval('public."MovimientoInventario_id_seq"'::regclass);


--
-- Name: OportunidadComercial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OportunidadComercial" ALTER COLUMN id SET DEFAULT nextval('public."OportunidadComercial_id_seq"'::regclass);


--
-- Name: OrdenPago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrdenPago" ALTER COLUMN id SET DEFAULT nextval('public."OrdenPago_id_seq"'::regclass);


--
-- Name: Pago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pago" ALTER COLUMN id SET DEFAULT nextval('public."Pago_id_seq"'::regclass);


--
-- Name: Producto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Producto" ALTER COLUMN id SET DEFAULT nextval('public."Producto_id_seq"'::regclass);


--
-- Name: Proveedor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proveedor" ALTER COLUMN id SET DEFAULT nextval('public."Proveedor_id_seq"'::regclass);


--
-- Name: RecepcionCompra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecepcionCompra" ALTER COLUMN id SET DEFAULT nextval('public."RecepcionCompra_id_seq"'::regclass);


--
-- Name: RetencionLote id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetencionLote" ALTER COLUMN id SET DEFAULT nextval('public."RetencionLote_id_seq"'::regclass);


--
-- Name: Usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario" ALTER COLUMN id SET DEFAULT nextval('public."Usuario_id_seq"'::regclass);


--
-- Name: Vehiculo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vehiculo" ALTER COLUMN id SET DEFAULT nextval('public."Vehiculo_id_seq"'::regclass);


--
-- Name: Venta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venta" ALTER COLUMN id SET DEFAULT nextval('public."Venta_id_seq"'::regclass);


--
-- Name: ActividadComercial ActividadComercial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActividadComercial"
    ADD CONSTRAINT "ActividadComercial_pkey" PRIMARY KEY (id);


--
-- Name: AsignacionLoteVenta AsignacionLoteVenta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AsignacionLoteVenta"
    ADD CONSTRAINT "AsignacionLoteVenta_pkey" PRIMARY KEY (id);


--
-- Name: Categoria Categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categoria"
    ADD CONSTRAINT "Categoria_pkey" PRIMARY KEY (id);


--
-- Name: Cliente Cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY (id);


--
-- Name: Compra Compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Compra"
    ADD CONSTRAINT "Compra_pkey" PRIMARY KEY (id);


--
-- Name: Cotizacion Cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cotizacion"
    ADD CONSTRAINT "Cotizacion_pkey" PRIMARY KEY (id);


--
-- Name: DesembolsoPago DesembolsoPago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DesembolsoPago"
    ADD CONSTRAINT "DesembolsoPago_pkey" PRIMARY KEY (id);


--
-- Name: Despacho Despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Despacho"
    ADD CONSTRAINT "Despacho_pkey" PRIMARY KEY (id);


--
-- Name: DetalleCompra DetalleCompra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCompra"
    ADD CONSTRAINT "DetalleCompra_pkey" PRIMARY KEY (id);


--
-- Name: DetalleCotizacion DetalleCotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCotizacion"
    ADD CONSTRAINT "DetalleCotizacion_pkey" PRIMARY KEY (id);


--
-- Name: DetalleDespacho DetalleDespacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleDespacho"
    ADD CONSTRAINT "DetalleDespacho_pkey" PRIMARY KEY (id);


--
-- Name: DetalleVenta DetalleVenta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleVenta"
    ADD CONSTRAINT "DetalleVenta_pkey" PRIMARY KEY (id);


--
-- Name: Gasto Gasto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Gasto"
    ADD CONSTRAINT "Gasto_pkey" PRIMARY KEY (id);


--
-- Name: HistorialCalidadLote HistorialCalidadLote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialCalidadLote"
    ADD CONSTRAINT "HistorialCalidadLote_pkey" PRIMARY KEY (id);


--
-- Name: HistorialOportunidad HistorialOportunidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOportunidad"
    ADD CONSTRAINT "HistorialOportunidad_pkey" PRIMARY KEY (id);


--
-- Name: HistorialOrdenPago HistorialOrdenPago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOrdenPago"
    ADD CONSTRAINT "HistorialOrdenPago_pkey" PRIMARY KEY (id);


--
-- Name: HojaRuta HojaRuta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HojaRuta"
    ADD CONSTRAINT "HojaRuta_pkey" PRIMARY KEY (id);


--
-- Name: Lote Lote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lote"
    ADD CONSTRAINT "Lote_pkey" PRIMARY KEY (id);


--
-- Name: MovimientoInventario MovimientoInventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MovimientoInventario"
    ADD CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY (id);


--
-- Name: OportunidadComercial OportunidadComercial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OportunidadComercial"
    ADD CONSTRAINT "OportunidadComercial_pkey" PRIMARY KEY (id);


--
-- Name: OrdenPago OrdenPago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrdenPago"
    ADD CONSTRAINT "OrdenPago_pkey" PRIMARY KEY (id);


--
-- Name: Pago Pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_pkey" PRIMARY KEY (id);


--
-- Name: Producto Producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Producto"
    ADD CONSTRAINT "Producto_pkey" PRIMARY KEY (id);


--
-- Name: Proveedor Proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Proveedor"
    ADD CONSTRAINT "Proveedor_pkey" PRIMARY KEY (id);


--
-- Name: RecepcionCompra RecepcionCompra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecepcionCompra"
    ADD CONSTRAINT "RecepcionCompra_pkey" PRIMARY KEY (id);


--
-- Name: RetencionLote RetencionLote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetencionLote"
    ADD CONSTRAINT "RetencionLote_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: Vehiculo Vehiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vehiculo"
    ADD CONSTRAINT "Vehiculo_pkey" PRIMARY KEY (id);


--
-- Name: Venta Venta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venta"
    ADD CONSTRAINT "Venta_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ActividadComercial_oportunidadId_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActividadComercial_oportunidadId_fecha_idx" ON public."ActividadComercial" USING btree ("oportunidadId", fecha);


--
-- Name: ActividadComercial_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActividadComercial_usuarioId_idx" ON public."ActividadComercial" USING btree ("usuarioId");


--
-- Name: AsignacionLoteVenta_detalleVentaId_loteId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AsignacionLoteVenta_detalleVentaId_loteId_key" ON public."AsignacionLoteVenta" USING btree ("detalleVentaId", "loteId");


--
-- Name: AsignacionLoteVenta_loteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AsignacionLoteVenta_loteId_idx" ON public."AsignacionLoteVenta" USING btree ("loteId");


--
-- Name: Categoria_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Categoria_nombre_key" ON public."Categoria" USING btree (nombre);


--
-- Name: Cliente_documento_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Cliente_documento_key" ON public."Cliente" USING btree (documento);


--
-- Name: Cotizacion_clienteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Cotizacion_clienteId_idx" ON public."Cotizacion" USING btree ("clienteId");


--
-- Name: Cotizacion_cotizacionAnteriorId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Cotizacion_cotizacionAnteriorId_key" ON public."Cotizacion" USING btree ("cotizacionAnteriorId");


--
-- Name: Cotizacion_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Cotizacion_estado_idx" ON public."Cotizacion" USING btree (estado);


--
-- Name: Cotizacion_oportunidadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Cotizacion_oportunidadId_idx" ON public."Cotizacion" USING btree ("oportunidadId");


--
-- Name: Cotizacion_vendedorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Cotizacion_vendedorId_idx" ON public."Cotizacion" USING btree ("vendedorId");


--
-- Name: DesembolsoPago_claveIdempotencia_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DesembolsoPago_claveIdempotencia_key" ON public."DesembolsoPago" USING btree ("claveIdempotencia");


--
-- Name: DesembolsoPago_fechaPago_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DesembolsoPago_fechaPago_idx" ON public."DesembolsoPago" USING btree ("fechaPago");


--
-- Name: DesembolsoPago_ordenPagoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DesembolsoPago_ordenPagoId_idx" ON public."DesembolsoPago" USING btree ("ordenPagoId");


--
-- Name: DesembolsoPago_responsableId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DesembolsoPago_responsableId_idx" ON public."DesembolsoPago" USING btree ("responsableId");


--
-- Name: Despacho_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Despacho_estado_idx" ON public."Despacho" USING btree (estado);


--
-- Name: Despacho_hojaRutaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Despacho_hojaRutaId_idx" ON public."Despacho" USING btree ("hojaRutaId");


--
-- Name: Despacho_ventaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Despacho_ventaId_idx" ON public."Despacho" USING btree ("ventaId");


--
-- Name: DetalleCotizacion_cotizacionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DetalleCotizacion_cotizacionId_idx" ON public."DetalleCotizacion" USING btree ("cotizacionId");


--
-- Name: DetalleCotizacion_productoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DetalleCotizacion_productoId_idx" ON public."DetalleCotizacion" USING btree ("productoId");


--
-- Name: DetalleDespacho_asignacionLoteVentaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DetalleDespacho_asignacionLoteVentaId_idx" ON public."DetalleDespacho" USING btree ("asignacionLoteVentaId");


--
-- Name: DetalleDespacho_despachoId_asignacionLoteVentaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DetalleDespacho_despachoId_asignacionLoteVentaId_key" ON public."DetalleDespacho" USING btree ("despachoId", "asignacionLoteVentaId");


--
-- Name: DetalleVenta_productoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DetalleVenta_productoId_idx" ON public."DetalleVenta" USING btree ("productoId");


--
-- Name: DetalleVenta_ventaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DetalleVenta_ventaId_idx" ON public."DetalleVenta" USING btree ("ventaId");


--
-- Name: HistorialCalidadLote_loteId_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistorialCalidadLote_loteId_fecha_idx" ON public."HistorialCalidadLote" USING btree ("loteId", fecha);


--
-- Name: HistorialCalidadLote_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistorialCalidadLote_usuarioId_idx" ON public."HistorialCalidadLote" USING btree ("usuarioId");


--
-- Name: HistorialOportunidad_oportunidadId_fechaCambio_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistorialOportunidad_oportunidadId_fechaCambio_idx" ON public."HistorialOportunidad" USING btree ("oportunidadId", "fechaCambio");


--
-- Name: HistorialOportunidad_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistorialOportunidad_usuarioId_idx" ON public."HistorialOportunidad" USING btree ("usuarioId");


--
-- Name: HistorialOrdenPago_ordenPagoId_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistorialOrdenPago_ordenPagoId_fecha_idx" ON public."HistorialOrdenPago" USING btree ("ordenPagoId", fecha);


--
-- Name: HistorialOrdenPago_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistorialOrdenPago_usuarioId_idx" ON public."HistorialOrdenPago" USING btree ("usuarioId");


--
-- Name: Lote_numeroLote_productoId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Lote_numeroLote_productoId_key" ON public."Lote" USING btree ("numeroLote", "productoId");


--
-- Name: MovimientoInventario_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MovimientoInventario_fecha_idx" ON public."MovimientoInventario" USING btree (fecha);


--
-- Name: MovimientoInventario_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MovimientoInventario_usuarioId_idx" ON public."MovimientoInventario" USING btree ("usuarioId");


--
-- Name: OportunidadComercial_clienteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OportunidadComercial_clienteId_idx" ON public."OportunidadComercial" USING btree ("clienteId");


--
-- Name: OportunidadComercial_etapa_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OportunidadComercial_etapa_idx" ON public."OportunidadComercial" USING btree (etapa);


--
-- Name: OportunidadComercial_fechaCreacion_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OportunidadComercial_fechaCreacion_idx" ON public."OportunidadComercial" USING btree ("fechaCreacion");


--
-- Name: OportunidadComercial_fechaSeguimiento_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OportunidadComercial_fechaSeguimiento_idx" ON public."OportunidadComercial" USING btree ("fechaSeguimiento");


--
-- Name: OportunidadComercial_vendedorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OportunidadComercial_vendedorId_idx" ON public."OportunidadComercial" USING btree ("vendedorId");


--
-- Name: OrdenPago_autorizadorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrdenPago_autorizadorId_idx" ON public."OrdenPago" USING btree ("autorizadorId");


--
-- Name: OrdenPago_compraId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrdenPago_compraId_idx" ON public."OrdenPago" USING btree ("compraId");


--
-- Name: OrdenPago_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrdenPago_estado_idx" ON public."OrdenPago" USING btree (estado);


--
-- Name: OrdenPago_fechaSolicitud_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrdenPago_fechaSolicitud_idx" ON public."OrdenPago" USING btree ("fechaSolicitud");


--
-- Name: OrdenPago_solicitanteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrdenPago_solicitanteId_idx" ON public."OrdenPago" USING btree ("solicitanteId");


--
-- Name: Pago_claveOperacion_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Pago_claveOperacion_key" ON public."Pago" USING btree ("claveOperacion");


--
-- Name: Pago_registradoPorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pago_registradoPorId_idx" ON public."Pago" USING btree ("registradoPorId");


--
-- Name: Producto_codigo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Producto_codigo_key" ON public."Producto" USING btree (codigo);


--
-- Name: Proveedor_ruc_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Proveedor_ruc_key" ON public."Proveedor" USING btree (ruc);


--
-- Name: RecepcionCompra_compraId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RecepcionCompra_compraId_idx" ON public."RecepcionCompra" USING btree ("compraId");


--
-- Name: RecepcionCompra_detalleCompraId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RecepcionCompra_detalleCompraId_idx" ON public."RecepcionCompra" USING btree ("detalleCompraId");


--
-- Name: RecepcionCompra_loteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RecepcionCompra_loteId_idx" ON public."RecepcionCompra" USING btree ("loteId");


--
-- Name: RecepcionCompra_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RecepcionCompra_usuarioId_idx" ON public."RecepcionCompra" USING btree ("usuarioId");


--
-- Name: RetencionLote_fechaRegistro_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RetencionLote_fechaRegistro_idx" ON public."RetencionLote" USING btree ("fechaRegistro");


--
-- Name: RetencionLote_loteId_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RetencionLote_loteId_estado_idx" ON public."RetencionLote" USING btree ("loteId", estado);


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: Vehiculo_placa_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Vehiculo_placa_key" ON public."Vehiculo" USING btree (placa);


--
-- Name: Venta_clienteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venta_clienteId_idx" ON public."Venta" USING btree ("clienteId");


--
-- Name: Venta_cotizacionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Venta_cotizacionId_key" ON public."Venta" USING btree ("cotizacionId");


--
-- Name: Venta_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venta_estado_idx" ON public."Venta" USING btree (estado);


--
-- Name: Venta_oportunidadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venta_oportunidadId_idx" ON public."Venta" USING btree ("oportunidadId");


--
-- Name: Venta_vendedorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venta_vendedorId_idx" ON public."Venta" USING btree ("vendedorId");


--
-- Name: ActividadComercial ActividadComercial_oportunidadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActividadComercial"
    ADD CONSTRAINT "ActividadComercial_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES public."OportunidadComercial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ActividadComercial ActividadComercial_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActividadComercial"
    ADD CONSTRAINT "ActividadComercial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AsignacionLoteVenta AsignacionLoteVenta_detalleVentaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AsignacionLoteVenta"
    ADD CONSTRAINT "AsignacionLoteVenta_detalleVentaId_fkey" FOREIGN KEY ("detalleVentaId") REFERENCES public."DetalleVenta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AsignacionLoteVenta AsignacionLoteVenta_loteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AsignacionLoteVenta"
    ADD CONSTRAINT "AsignacionLoteVenta_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES public."Lote"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Compra Compra_proveedorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Compra"
    ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES public."Proveedor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Cotizacion Cotizacion_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cotizacion"
    ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Cotizacion Cotizacion_cotizacionAnteriorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cotizacion"
    ADD CONSTRAINT "Cotizacion_cotizacionAnteriorId_fkey" FOREIGN KEY ("cotizacionAnteriorId") REFERENCES public."Cotizacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Cotizacion Cotizacion_oportunidadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cotizacion"
    ADD CONSTRAINT "Cotizacion_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES public."OportunidadComercial"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Cotizacion Cotizacion_vendedorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cotizacion"
    ADD CONSTRAINT "Cotizacion_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DesembolsoPago DesembolsoPago_ordenPagoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DesembolsoPago"
    ADD CONSTRAINT "DesembolsoPago_ordenPagoId_fkey" FOREIGN KEY ("ordenPagoId") REFERENCES public."OrdenPago"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DesembolsoPago DesembolsoPago_responsableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DesembolsoPago"
    ADD CONSTRAINT "DesembolsoPago_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Despacho Despacho_hojaRutaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Despacho"
    ADD CONSTRAINT "Despacho_hojaRutaId_fkey" FOREIGN KEY ("hojaRutaId") REFERENCES public."HojaRuta"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Despacho Despacho_ventaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Despacho"
    ADD CONSTRAINT "Despacho_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES public."Venta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleCompra DetalleCompra_compraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCompra"
    ADD CONSTRAINT "DetalleCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES public."Compra"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleCompra DetalleCompra_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCompra"
    ADD CONSTRAINT "DetalleCompra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleCotizacion DetalleCotizacion_cotizacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCotizacion"
    ADD CONSTRAINT "DetalleCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES public."Cotizacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleCotizacion DetalleCotizacion_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleCotizacion"
    ADD CONSTRAINT "DetalleCotizacion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleDespacho DetalleDespacho_asignacionLoteVentaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleDespacho"
    ADD CONSTRAINT "DetalleDespacho_asignacionLoteVentaId_fkey" FOREIGN KEY ("asignacionLoteVentaId") REFERENCES public."AsignacionLoteVenta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleDespacho DetalleDespacho_despachoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleDespacho"
    ADD CONSTRAINT "DetalleDespacho_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES public."Despacho"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleVenta DetalleVenta_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleVenta"
    ADD CONSTRAINT "DetalleVenta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DetalleVenta DetalleVenta_ventaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleVenta"
    ADD CONSTRAINT "DetalleVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES public."Venta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Gasto Gasto_responsableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Gasto"
    ADD CONSTRAINT "Gasto_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistorialCalidadLote HistorialCalidadLote_loteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialCalidadLote"
    ADD CONSTRAINT "HistorialCalidadLote_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES public."Lote"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistorialCalidadLote HistorialCalidadLote_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialCalidadLote"
    ADD CONSTRAINT "HistorialCalidadLote_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistorialOportunidad HistorialOportunidad_oportunidadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOportunidad"
    ADD CONSTRAINT "HistorialOportunidad_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES public."OportunidadComercial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistorialOportunidad HistorialOportunidad_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOportunidad"
    ADD CONSTRAINT "HistorialOportunidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistorialOrdenPago HistorialOrdenPago_ordenPagoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOrdenPago"
    ADD CONSTRAINT "HistorialOrdenPago_ordenPagoId_fkey" FOREIGN KEY ("ordenPagoId") REFERENCES public."OrdenPago"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistorialOrdenPago HistorialOrdenPago_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistorialOrdenPago"
    ADD CONSTRAINT "HistorialOrdenPago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HojaRuta HojaRuta_conductorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HojaRuta"
    ADD CONSTRAINT "HojaRuta_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HojaRuta HojaRuta_vehiculoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HojaRuta"
    ADD CONSTRAINT "HojaRuta_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES public."Vehiculo"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lote Lote_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lote"
    ADD CONSTRAINT "Lote_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MovimientoInventario MovimientoInventario_loteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MovimientoInventario"
    ADD CONSTRAINT "MovimientoInventario_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES public."Lote"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MovimientoInventario MovimientoInventario_productoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MovimientoInventario"
    ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES public."Producto"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MovimientoInventario MovimientoInventario_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MovimientoInventario"
    ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OportunidadComercial OportunidadComercial_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OportunidadComercial"
    ADD CONSTRAINT "OportunidadComercial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OportunidadComercial OportunidadComercial_vendedorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OportunidadComercial"
    ADD CONSTRAINT "OportunidadComercial_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrdenPago OrdenPago_autorizadorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrdenPago"
    ADD CONSTRAINT "OrdenPago_autorizadorId_fkey" FOREIGN KEY ("autorizadorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrdenPago OrdenPago_compraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrdenPago"
    ADD CONSTRAINT "OrdenPago_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES public."Compra"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrdenPago OrdenPago_solicitanteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrdenPago"
    ADD CONSTRAINT "OrdenPago_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Pago Pago_registradoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pago Pago_ventaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES public."Venta"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Producto Producto_categoriaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Producto"
    ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES public."Categoria"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecepcionCompra RecepcionCompra_compraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecepcionCompra"
    ADD CONSTRAINT "RecepcionCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES public."Compra"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecepcionCompra RecepcionCompra_detalleCompraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecepcionCompra"
    ADD CONSTRAINT "RecepcionCompra_detalleCompraId_fkey" FOREIGN KEY ("detalleCompraId") REFERENCES public."DetalleCompra"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecepcionCompra RecepcionCompra_loteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecepcionCompra"
    ADD CONSTRAINT "RecepcionCompra_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES public."Lote"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RecepcionCompra RecepcionCompra_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecepcionCompra"
    ADD CONSTRAINT "RecepcionCompra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RetencionLote RetencionLote_liberadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetencionLote"
    ADD CONSTRAINT "RetencionLote_liberadoPorId_fkey" FOREIGN KEY ("liberadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RetencionLote RetencionLote_loteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetencionLote"
    ADD CONSTRAINT "RetencionLote_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES public."Lote"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RetencionLote RetencionLote_registradoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetencionLote"
    ADD CONSTRAINT "RetencionLote_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Venta Venta_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venta"
    ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Venta Venta_cotizacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venta"
    ADD CONSTRAINT "Venta_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES public."Cotizacion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Venta Venta_oportunidadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venta"
    ADD CONSTRAINT "Venta_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES public."OportunidadComercial"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Venta Venta_vendedorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venta"
    ADD CONSTRAINT "Venta_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict GUaRsPZ8gBlMX0TIard2fpsGvK2K9nabY2AzEW3z1lb7FUCacosfaKyl09Z1iVV

