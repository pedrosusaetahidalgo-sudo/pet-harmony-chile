/**
 * Tests del helper LINKS (Sprint 1 P1, 2026-04-28).
 *
 * LINKS es el punto unico de generacion de URLs. Si una ruta cambia,
 * solo este archivo se actualiza. Estos tests garantizan que el slugify
 * normaliza acentos chilenos correctamente y que los query params
 * se construyen como espera el router.
 */
import { describe, it, expect } from 'vitest';
import { LINKS } from '../links';

describe('LINKS — rutas estaticas', () => {
  it('rutas raiz sin parametros', () => {
    expect(LINKS.home()).toBe('/home');
    expect(LINKS.feed()).toBe('/feed');
    expect(LINKS.chat()).toBe('/chat');
    expect(LINKS.adoption()).toBe('/adoption');
    expect(LINKS.maps()).toBe('/maps');
    expect(LINKS.auth()).toBe('/auth');
    expect(LINKS.terms()).toBe('/terms');
    expect(LINKS.privacy()).toBe('/privacy');
  });

  it('rutas modelo v2', () => {
    expect(LINKS.pawCore()).toBe('/paw-core');
    expect(LINKS.pawMember()).toBe('/paw-member');
    expect(LINKS.pawSupport()).toBe('/paw-support');
    expect(LINKS.pawVoices()).toBe('/paw-voices');
    expect(LINKS.pawCompanys()).toBe('/paw-companys');
  });

  it('donaciones() alias deprecado apunta a paw-support', () => {
    expect(LINKS.donaciones()).toBe('/paw-support');
  });

  it('rutas calendario unificado con tabs', () => {
    expect(LINKS.calendarToday()).toBe('/calendario?tab=hoy');
    expect(LINKS.remindersTab()).toBe('/calendario?tab=recordatorios');
    expect(LINKS.routinesTab()).toBe('/calendario?tab=rutinas');
    expect(LINKS.bookingsTab()).toBe('/calendario?tab=reservas');
  });

  it('legacy reminders se mantiene', () => {
    expect(LINKS.reminders()).toBe('/reminders');
  });
});

describe('LINKS — rutas con parametros simples', () => {
  it('vetProfile arma /veterinarios/:slug', () => {
    expect(LINKS.vetProfile('dra-juana-perez')).toBe('/veterinarios/dra-juana-perez');
  });

  it('petClinical arma /ficha/:petId', () => {
    expect(LINKS.petClinical('uuid-1234')).toBe('/ficha/uuid-1234');
  });

  it('petClinicalVet anade ?mode=vet', () => {
    expect(LINKS.petClinicalVet('uuid-1234')).toBe('/ficha/uuid-1234?mode=vet');
  });

  it('petClinicalShare anade ?action=share', () => {
    expect(LINKS.petClinicalShare('uuid')).toBe('/ficha/uuid?action=share');
  });

  it('petClinicalBook anade ?action=book', () => {
    expect(LINKS.petClinicalBook('uuid')).toBe('/ficha/uuid?action=book');
  });

  it('userProfile arma /user/:userId', () => {
    expect(LINKS.userProfile('user-123')).toBe('/user/user-123');
  });

  it('petRoutines arma /mascota/:petId/rutinas', () => {
    expect(LINKS.petRoutines('pet-id')).toBe('/mascota/pet-id/rutinas');
  });

  it('services con tipo valido', () => {
    expect(LINKS.services('walkers')).toBe('/services/walkers');
    expect(LINKS.services('vets')).toBe('/services/vets');
    expect(LINKS.services('sitters')).toBe('/services/sitters');
    expect(LINKS.services('trainers')).toBe('/services/trainers');
    expect(LINKS.services('groomers')).toBe('/services/groomers');
  });
});

describe('LINKS — slugify de comunas chilenas con acentos', () => {
  it('slugify normaliza acentos espanol', () => {
    expect(LINKS.vetsByComuna('Ñuñoa')).toBe('/veterinarios/comuna/nunoa');
    expect(LINKS.vetsByComuna('Peñalolén')).toBe('/veterinarios/comuna/penalolen');
    expect(LINKS.vetsByComuna('Vitacura')).toBe('/veterinarios/comuna/vitacura');
  });

  it('slugify convierte a lowercase', () => {
    expect(LINKS.vetsByComuna('LAS CONDES')).toBe('/veterinarios/comuna/las-condes');
  });

  it('slugify reemplaza espacios por guiones', () => {
    expect(LINKS.vetsByComuna('Lo Barnechea')).toBe('/veterinarios/comuna/lo-barnechea');
    expect(LINKS.vetsByComuna('Estación Central')).toBe('/veterinarios/comuna/estacion-central');
  });

  it('slugify colapsa espacios multiples', () => {
    expect(LINKS.vetsByComuna('San   Bernardo')).toBe('/veterinarios/comuna/san-bernardo');
  });

  it('slugify remueve caracteres especiales', () => {
    expect(LINKS.vetsByComuna('Test/with#special?chars')).toBe(
      '/veterinarios/comuna/testwithspecialchars'
    );
  });

  it('slugify trim guiones del inicio/final', () => {
    expect(LINKS.vetsByComuna('  La Florida  ')).toBe('/veterinarios/comuna/la-florida');
  });

  it('slugify funciona en specialty', () => {
    expect(LINKS.vetsBySpecialty('Cardiología')).toBe('/veterinarios/especialidad/cardiologia');
    expect(LINKS.vetsBySpecialty('Medicina Interna')).toBe(
      '/veterinarios/especialidad/medicina-interna'
    );
  });
});

describe('LINKS — query params', () => {
  it('vetsForService sin urgent', () => {
    expect(LINKS.vetsForService('vacuna')).toBe('/veterinarios?service=vacuna');
  });

  it('vetsForService con urgent=true', () => {
    expect(LINKS.vetsForService('emergencia', true)).toBe(
      '/veterinarios?service=emergencia&urgent=1'
    );
  });

  it('vetsForService con urgent=false omite el flag', () => {
    expect(LINKS.vetsForService('consulta', false)).toBe('/veterinarios?service=consulta');
  });

  it('vetsBySpecialtyAndComuna combina path + query con slugify', () => {
    expect(LINKS.vetsBySpecialtyAndComuna('Cardiología', 'Las Condes')).toBe(
      '/veterinarios/especialidad/cardiologia?comuna=las-condes'
    );
  });
});

describe('LINKS — authReturn encoding', () => {
  it('encodea returnTo path simple', () => {
    expect(LINKS.authReturn('/home')).toBe('/auth?returnTo=%2Fhome');
  });

  it('encodea path con query params', () => {
    expect(LINKS.authReturn('/ficha/abc?action=share')).toBe(
      '/auth?returnTo=%2Fficha%2Fabc%3Faction%3Dshare'
    );
  });

  it('encodea acentos del returnTo', () => {
    expect(LINKS.authReturn('/veterinarios/comuna/ñuñoa')).toBe(
      '/auth?returnTo=%2Fveterinarios%2Fcomuna%2F%C3%B1u%C3%B1oa'
    );
  });
});
