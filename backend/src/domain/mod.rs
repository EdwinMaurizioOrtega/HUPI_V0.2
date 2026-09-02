//! Reglas de negocio puras portadas desde `mobile/src/domain/`.
//! No dependen de HTTP ni de la base de datos.
//!
//! Parte de estas funciones todavía no tienen ruta que las consuma: alimentan
//! los handlers pendientes en `routes/stubs.rs`.
#![allow(dead_code)]

pub mod cancellation;
pub mod masking;
pub mod password;
pub mod pricing;
pub mod profile;
pub mod search;
pub mod text_search;
pub mod verification;
pub mod walk_metrics;
