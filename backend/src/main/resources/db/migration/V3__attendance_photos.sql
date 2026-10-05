-- ═══════════════════════════════════════════════════════════════════════════
-- V3: Vínculo de fotos com agendamento, cliente, tipo e autor
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE photos ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS photo_type VARCHAR(50);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS taken_by UUID;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS caption VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_photos_appointment ON photos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_photos_client ON photos(client_id);
