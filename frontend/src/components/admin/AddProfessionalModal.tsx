import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { XIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import {
  type ProfessionalAdminUpdateInput,
  type ProfessionalCreateInput,
  type ProfessionalMin,
} from '@/services/professionalServices';
import {
  createWorkingHours,
  deleteWorkingHours,
  listWorkingHours,
  updateWorkingHours,
  type DayOfWeek,
  type WorkingHours,
  type WorkingHoursInput,
} from '@/services/workingHoursServices';
import { formatPhone } from '@/utils/formatters';

// DAYS_ORDER and labels
const DAYS_ORDER: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
];
const DAY_LABEL: Record<DayOfWeek, string> = {
  MONDAY: 'Segunda', TUESDAY: 'Terca', WEDNESDAY: 'Quarta', THURSDAY: 'Quinta',
  FRIDAY: 'Sexta', SATURDAY: 'Sabado', SUNDAY: 'Domingo',
};
const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'SEG', TUESDAY: 'TER', WEDNESDAY: 'QUA', THURSDAY: 'QUI',
  FRIDAY: 'SEX', SATURDAY: 'SAB', SUNDAY: 'DOM',
};

function formatCpf(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + ':' + d.slice(2);
}
function toHHmmss(val: string): string {
  if (!val) return '';
  const t = val.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}$/.test(t)) return t + ':00';
  return t;
}
function toHHmm(val: string | null | undefined): string {
  if (!val) return '';
  return val.slice(0, 5);
}
function whErrMsg(err: unknown): string {
  if (isAxiosError(err)) {
    const s = err.response?.status;
    if (s === 400) return 'Ja existe jornada para este dia, ou o horario de inicio e posterior ao termino.';
    if (s === 404) return 'Profissional ou estabelecimento nao encontrado.';
  }
  return 'Nao foi possivel salvar. Tente novamente.';
}

// ─── JornadaForm — formulário de criação em lote ou edição individual ─────────

interface JornadaFormProps {
  /** Presente apenas no modo edição individual (clique em ✏️). */
  initial?: WorkingHours;
  /** Dias já cadastrados — fica desabilitado na seleção múltipla de novos dias. */
  disabledDays?: DayOfWeek[];
  onSave: (inputs: WorkingHoursInput[]) => Promise<void>;
  onCancel: () => void;
  fontRegular: string;
  fontSemiBold: string;
}

function JornadaForm({ initial, disabledDays = [], onSave, onCancel, fontRegular, fontSemiBold }: JornadaFormProps) {
  const isEditing = !!initial;

  // No modo edição individual os chips ficam fixos (apenas 1 dia selecionado)
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    isEditing ? [initial!.dayOfWeek] : []
  );
  const [startTime, setStartTime] = useState(toHHmm(initial?.startTime));
  const [endTime, setEndTime] = useState(toHHmm(initial?.endTime));
  const [breakStart, setBreakStart] = useState(toHHmm(initial?.breakStart));
  const [breakEnd, setBreakEnd] = useState(toHHmm(initial?.breakEnd));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  /** Alterna seleção de um dia (apenas no modo criação). */
  function toggleDay(d: DayOfWeek) {
    if (disabledDays.includes(d)) return;
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  /** Atalhos de seleção rápida. */
  function selectPreset(preset: 'weekdays' | 'weekdaysSat' | 'all' | 'none') {
    const available = (days: DayOfWeek[]) => days.filter((d) => !disabledDays.includes(d));
    if (preset === 'weekdays')    setSelectedDays(available(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']));
    if (preset === 'weekdaysSat') setSelectedDays(available(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']));
    if (preset === 'all')         setSelectedDays(available(DAYS_ORDER));
    if (preset === 'none')        setSelectedDays([]);
  }

  /** Atalho de horário comercial padrão. */
  function applyDefaultSchedule() {
    setStartTime('08:00');
    setEndTime('18:00');
    setBreakStart('12:00');
    setBreakEnd('13:00');
  }

  async function handleSave() {
    if (isEditing && selectedDays.length === 0) { setFormError('Nenhum dia selecionado.'); return; }
    if (!isEditing && selectedDays.length === 0) { setFormError('Selecione ao menos um dia da semana.'); return; }
    if (!startTime || !endTime) { setFormError('Informe horario de inicio e termino.'); return; }
    if (breakStart && !breakEnd) { setFormError('Informe tambem o termino da pausa.'); return; }
    if (!breakStart && breakEnd) { setFormError('Informe tambem o inicio da pausa.'); return; }
    setFormError(''); setSaving(true);
    try {
      const inputs: WorkingHoursInput[] = selectedDays.map((d) => ({
        dayOfWeek: d,
        startTime: toHHmmss(startTime),
        endTime: toHHmmss(endTime),
        breakStart: breakStart ? toHHmmss(breakStart) : null,
        breakEnd: breakEnd ? toHHmmss(breakEnd) : null,
      }));
      await onSave(inputs);
    } catch (err) { setFormError(whErrMsg(err)); } finally { setSaving(false); }
  }

  return (
    <View style={jStyles.formCard}>

      {/* Seleção de dias */}
      {!isEditing && (
        <>
          <Text style={[jStyles.formLabel, { fontFamily: fontSemiBold }]}>Dias da semana</Text>

          {/* Chips de seleção múltipla */}
          <View style={jStyles.dayChipsRow}>
            {DAYS_ORDER.map((d) => {
              const disabled = disabledDays.includes(d);
              const selected = selectedDays.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  disabled={disabled}
                  style={[jStyles.dayChip, selected && jStyles.dayChipSelected, disabled && jStyles.dayChipDisabled]}
                  onPress={() => toggleDay(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[jStyles.dayChipText, { fontFamily: fontRegular }, selected && jStyles.dayChipTextSelected, disabled && jStyles.dayChipTextDisabled]}>
                    {DAY_SHORT[d]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Atalhos de seleção rápida */}
          <View style={jStyles.presetRow}>
            <TouchableOpacity style={jStyles.presetBtn} onPress={() => selectPreset('weekdays')} activeOpacity={0.7}>
              <Text style={[jStyles.presetBtnText, { fontFamily: fontRegular }]}>Seg–Sex</Text>
            </TouchableOpacity>
            <TouchableOpacity style={jStyles.presetBtn} onPress={() => selectPreset('weekdaysSat')} activeOpacity={0.7}>
              <Text style={[jStyles.presetBtnText, { fontFamily: fontRegular }]}>Seg–Sáb</Text>
            </TouchableOpacity>
            <TouchableOpacity style={jStyles.presetBtn} onPress={() => selectPreset('all')} activeOpacity={0.7}>
              <Text style={[jStyles.presetBtnText, { fontFamily: fontRegular }]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[jStyles.presetBtn, jStyles.presetBtnMuted]} onPress={() => selectPreset('none')} activeOpacity={0.7}>
              <Text style={[jStyles.presetBtnText, { fontFamily: fontRegular, color: Colors.grey500 }]}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Atalho de horário padrão */}
      {!isEditing && (
        <TouchableOpacity style={jStyles.defaultScheduleBtn} onPress={applyDefaultSchedule} activeOpacity={0.8}>
          <Text style={[jStyles.defaultScheduleBtnText, { fontFamily: fontSemiBold }]}>⏰ Horário comercial  08:00–18:00</Text>
        </TouchableOpacity>
      )}

      {/* Horário de início e término */}
      <View style={jStyles.timeRow}>
        <View style={{ flex: 1 }}>
          <Text style={[jStyles.formLabel, { fontFamily: fontSemiBold }]}>Inicio</Text>
          <TextInput style={[jStyles.timeInput, { fontFamily: fontRegular }]} placeholder="09:00" placeholderTextColor={Colors.grey400} value={startTime} onChangeText={(t) => setStartTime(maskTime(t))} keyboardType="number-pad" maxLength={5} />
        </View>
        <View style={jStyles.timeSep}><Text style={{ color: Colors.grey400, fontSize: 18 }}>–</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[jStyles.formLabel, { fontFamily: fontSemiBold }]}>Termino</Text>
          <TextInput style={[jStyles.timeInput, { fontFamily: fontRegular }]} placeholder="18:00" placeholderTextColor={Colors.grey400} value={endTime} onChangeText={(t) => setEndTime(maskTime(t))} keyboardType="number-pad" maxLength={5} />
        </View>
      </View>

      {/* Pausa */}
      <Text style={[jStyles.formLabel, { fontFamily: fontSemiBold }]}>
        Pausa <Text style={{ fontFamily: fontRegular, color: Colors.grey400 }}>(opcional)</Text>
      </Text>
      <View style={jStyles.timeRow}>
        <View style={{ flex: 1 }}>
          <TextInput style={[jStyles.timeInput, { fontFamily: fontRegular }]} placeholder="12:00" placeholderTextColor={Colors.grey400} value={breakStart} onChangeText={(t) => setBreakStart(maskTime(t))} keyboardType="number-pad" maxLength={5} />
        </View>
        <View style={jStyles.timeSep}><Text style={{ color: Colors.grey400, fontSize: 18 }}>–</Text></View>
        <View style={{ flex: 1 }}>
          <TextInput style={[jStyles.timeInput, { fontFamily: fontRegular }]} placeholder="13:00" placeholderTextColor={Colors.grey400} value={breakEnd} onChangeText={(t) => setBreakEnd(maskTime(t))} keyboardType="number-pad" maxLength={5} />
        </View>
      </View>

      {formError ? <Text style={[jStyles.formError, { fontFamily: fontRegular }]}>{formError}</Text> : null}

      <View style={jStyles.formActions}>
        <TouchableOpacity style={jStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={[jStyles.cancelBtnText, { fontFamily: fontRegular }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[jStyles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={[jStyles.saveBtnText, { fontFamily: fontSemiBold }]}>
                {isEditing ? 'Salvar' : `Salvar${selectedDays.length > 1 ? ` (${selectedDays.length} dias)` : ''}`}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── JornadaTab ───────────────────────────────────────────────────────────────

interface JornadaTabProps { establishmentId: string; professionalId: string; fontRegular: string; fontSemiBold: string; }
function JornadaTab({ establishmentId, professionalId, fontRegular, fontSemiBold }: JornadaTabProps) {
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  async function load() {
    setLoading(true); setLoadError('');
    try { const data = await listWorkingHours(establishmentId, professionalId); setHours(data); }
    catch { setLoadError('Nao foi possivel carregar as jornadas.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  /**
   * Cria ou atualiza múltiplos dias de uma só vez.
   * Para cada dia selecionado: atualiza se já existir, cria se não existir.
   */
  async function handleBatchSave(inputs: WorkingHoursInput[]) {
    for (const input of inputs) {
      const existing = hours.find((h) => h.dayOfWeek === input.dayOfWeek);
      if (existing) {
        await updateWorkingHours(establishmentId, professionalId, existing.id, input);
      } else {
        await createWorkingHours(establishmentId, professionalId, input);
      }
    }
    setAddingNew(false);
    await load();
  }

  async function handleUpdate(id: string, inputs: WorkingHoursInput[]) {
    // Na edição individual sempre chega array de 1 item
    await updateWorkingHours(establishmentId, professionalId, id, inputs[0]);
    setEditingId(null);
    await load();
  }

  function handleDelete(wh: WorkingHours) {
    Alert.alert('Remover jornada', 'Tem certeza que deseja remover a jornada de ' + DAY_LABEL[wh.dayOfWeek] + '?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteWorkingHours(establishmentId, professionalId, wh.id); await load(); }
        catch { Alert.alert('Erro', 'Nao foi possivel remover a jornada.'); }
      }},
    ]);
  }

  const registeredDays = hours.map((h) => h.dayOfWeek);
  const sortedHours = [...hours].sort((a, b) => DAYS_ORDER.indexOf(a.dayOfWeek) - DAYS_ORDER.indexOf(b.dayOfWeek));

  if (loading) return <View style={jStyles.centered}><ActivityIndicator color={Colors.gold} /></View>;
  if (loadError) return (
    <View style={jStyles.centered}>
      <Text style={[jStyles.errorMsg, { fontFamily: fontRegular }]}>{loadError}</Text>
      <TouchableOpacity onPress={load} style={jStyles.retryBtn}><Text style={[{ color: Colors.gold, fontSize: 13 }, { fontFamily: fontSemiBold }]}>Tentar novamente</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={jStyles.container}>
      {sortedHours.length === 0 && !addingNew ? (
        <View style={jStyles.emptyBox}><Text style={[jStyles.emptyText, { fontFamily: fontRegular }]}>Nenhuma jornada cadastrada.</Text></View>
      ) : (
        sortedHours.map((wh) => (
          <View key={wh.id}>
            {editingId === wh.id ? (
              <JornadaForm
                initial={wh}
                onSave={(inputs) => handleUpdate(wh.id, inputs)}
                onCancel={() => setEditingId(null)}
                fontRegular={fontRegular}
                fontSemiBold={fontSemiBold}
              />
            ) : (
              <View style={jStyles.whRow}>
                <View style={jStyles.whInfo}>
                  <Text style={[jStyles.whDay, { fontFamily: fontSemiBold }]}>{DAY_LABEL[wh.dayOfWeek]}</Text>
                  <Text style={[jStyles.whTime, { fontFamily: fontRegular }]}>
                    {toHHmm(wh.startTime)} – {toHHmm(wh.endTime)}
                    {wh.breakStart && wh.breakEnd ? '  ·  pausa ' + toHHmm(wh.breakStart) + '–' + toHHmm(wh.breakEnd) : ''}
                  </Text>
                </View>
                <View style={jStyles.whActions}>
                  <TouchableOpacity onPress={() => { setAddingNew(false); setEditingId(wh.id); }} style={jStyles.iconBtn} activeOpacity={0.7}><Text style={jStyles.iconBtnText}>✏️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(wh)} style={jStyles.iconBtn} activeOpacity={0.7}><Text style={jStyles.iconBtnText}>🗑️</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))
      )}
      {addingNew ? (
        <JornadaForm
          disabledDays={registeredDays}
          onSave={handleBatchSave}
          onCancel={() => setAddingNew(false)}
          fontRegular={fontRegular}
          fontSemiBold={fontSemiBold}
        />
      ) : (
        registeredDays.length < 7 && (
          <TouchableOpacity style={jStyles.addBtn} onPress={() => { setEditingId(null); setAddingNew(true); }} activeOpacity={0.8}>
            <Text style={[jStyles.addBtnText, { fontFamily: fontSemiBold }]}>+ Adicionar jornada</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

// Main Modal props
interface AddProfessionalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ProfessionalCreateInput) => Promise<void>;
  mode?: 'create' | 'edit';
  professional?: ProfessionalMin;
  establishmentId?: string;
  onUpdate?: (data: ProfessionalAdminUpdateInput) => Promise<void>;
}

export function AddProfessionalModal({
  visible, onClose, onSubmit, mode = 'create', professional, establishmentId, onUpdate,
}: AddProfessionalModalProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();
  const isEdit = mode === 'edit';
  const [activeTab, setActiveTab] = useState<'dados' | 'jornada'>('dados');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commission, setCommission] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const prevVisible = useRef(false);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      if (isEdit && professional) {
        setName(professional.name ?? ''); setNickname(professional.nickname ?? '');
        setSpecialty(professional.specialty ?? ''); setPhone(professional.phone ?? '');
        setEmail(professional.email ?? ''); setCommission(String(professional.commission ?? 50));
      } else { resetForm(); }
      setActiveTab('dados');
    }
    prevVisible.current = visible;
  }, [visible, isEdit, professional]);

  function resetForm() { setName(''); setNickname(''); setSpecialty(''); setCpf(''); setPhone(''); setEmail(''); setCommission('50'); setError(''); }

  async function handleCreate() {
    if (!name.trim()) { setError('O nome do profissional e obrigatorio.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Informe um e-mail valido.'); return; }
    if (!phone.trim()) { setError('Informe um telefone de contato.'); return; }
    setError(''); setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), nickname: nickname.trim() || undefined, specialty: specialty.trim() || 'Profissional', cpf: cpf.replace(/\D/g, '') || '000.000.000-00', phone: phone.trim(), email: email.trim(), password: 'TempPassword123!', commission: Number(commission) || 50 });
      resetForm(); onClose();
    } catch (err: any) { setError(err?.message || 'Nao foi possivel cadastrar o profissional.'); }
    finally { setSubmitting(false); }
  }

  async function handleUpdate() {
    if (!name.trim()) { setError('O nome do profissional e obrigatorio.'); return; }
    if (!onUpdate) return;
    setError(''); setSubmitting(true);
    try {
      await onUpdate({ name: name.trim(), nickname: nickname.trim() || undefined, specialty: specialty.trim() || undefined, phone: phone.trim() || undefined, email: email.trim() || undefined, commission: Number(commission) || undefined });
    } catch (err: any) { setError(err?.message || 'Nao foi possivel salvar as alteracoes.'); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.title, { fontFamily: fontSemiBold }]}>{isEdit ? (professional?.name ?? 'Editar Profissional') : 'Novo Profissional'}</Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>{isEdit ? 'Edite os dados ou configure a jornada de trabalho' : 'Adicione um membro a equipe do estabelecimento'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}><XIcon size={18} color={Colors.grey500} /></TouchableOpacity>
          </View>

          {isEdit && (
            <View style={styles.tabBar}>
              {(['dados', 'jornada'] as const).map((tab) => (
                <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
                  <Text style={[styles.tabBtnText, { fontFamily: activeTab === tab ? fontSemiBold : fontRegular }, activeTab === tab && styles.tabBtnTextActive]}>{tab === 'dados' ? 'Dados' : 'Jornada'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isEdit && activeTab === 'jornada' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              {establishmentId && professional?.id ? (
                <JornadaTab establishmentId={establishmentId} professionalId={professional.id} fontRegular={fontRegular} fontSemiBold={fontSemiBold} />
              ) : (
                <Text style={[styles.errorText, { fontFamily: fontRegular }]}>Dados de estabelecimento ou profissional indisponiveis.</Text>
              )}
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <InputField label="Nome completo *" placeholder="Ex: Carlos Silva" value={name} onChangeText={setName} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}><InputField label="Apelido / Exibicao" placeholder="Ex: Carlinhos" value={nickname} onChangeText={setNickname} /></View>
                <View style={{ flex: 1 }}><InputField label="Especialidade" placeholder="Ex: Barbeiro Master" value={specialty} onChangeText={setSpecialty} /></View>
              </View>
              <InputField label="E-mail *" placeholder="carlos@barbearia.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.row}>
                <View style={{ flex: 1 }}><InputField label="Telefone / Celular *" placeholder="(99) 99999-9999" value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" /></View>
                {!isEdit && <View style={{ flex: 1 }}><InputField label="CPF" placeholder="000.000.000-00" value={cpf} onChangeText={(t) => setCpf(formatCpf(t))} keyboardType="number-pad" /></View>}
              </View>
              <InputField label="Comissao Padrao (%)" placeholder="Ex: 50" value={commission} onChangeText={setCommission} keyboardType="number-pad" />
              {error ? <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{error}</Text> : null}
              <View style={styles.actions}>
                <Button label={submitting ? 'Salvando...' : isEdit ? 'Salvar Dados' : 'Cadastrar Profissional'} onPress={isEdit ? handleUpdate : handleCreate} disabled={submitting} />
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(13, 13, 18, 0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: Colors.dark, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.grey100 },
  headerTitleCol: { gap: 4, flex: 1 },
  title: { fontSize: 18, color: Colors.dark },
  subtitle: { fontSize: 13, color: Colors.grey400 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.grey100 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 20, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.grey100 },
  tabBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  tabBtnText: { fontSize: 14, color: Colors.grey500 },
  tabBtnTextActive: { color: Colors.white },
  formContent: { paddingHorizontal: 24, paddingTop: 18, gap: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
  actions: { marginTop: 8, paddingBottom: 12 },
});

const jStyles = StyleSheet.create({
  container: { gap: 12 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 12 },
  errorMsg: { fontSize: 13, color: Colors.error, textAlign: 'center' },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  emptyBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.grey100 },
  emptyText: { fontSize: 13, color: Colors.grey400, fontStyle: 'italic' },
  whRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.grey100 },
  whInfo: { flex: 1, gap: 3 },
  whDay: { fontSize: 14, color: Colors.dark },
  whTime: { fontSize: 12, color: Colors.grey500 },
  whActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: Colors.surface },
  iconBtnText: { fontSize: 16 },
  addBtn: { paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.gold, borderStyle: 'dashed' },
  addBtnText: { fontSize: 14, color: Colors.gold },
  formCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.grey100 },
  formLabel: { fontSize: 13, color: Colors.grey500 },
  formError: { fontSize: 12, color: Colors.error },
  // Chips de dia — agora em grid ao invés de scroll horizontal
  dayScroll: { flexGrow: 0 },
  dayChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.grey200, backgroundColor: Colors.white },
  dayChipSelected: { borderColor: Colors.gold, backgroundColor: Colors.gold },
  dayChipDisabled: { borderColor: Colors.grey100, backgroundColor: Colors.grey100, opacity: 0.5 },
  dayChipText: { fontSize: 12, color: Colors.dark },
  dayChipTextSelected: { color: Colors.white },
  dayChipTextDisabled: { color: Colors.grey400 },
  // Atalhos de seleção rápida
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.grey200 },
  presetBtnMuted: { backgroundColor: Colors.surface },
  presetBtnText: { fontSize: 11, color: Colors.dark },
  // Atalho de horário padrão
  defaultScheduleBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.gold, alignItems: 'center' },
  defaultScheduleBtnText: { fontSize: 13, color: Colors.gold },
  // Horários
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeSep: { alignItems: 'center', paddingTop: 4 },
  timeInput: { height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.grey200, backgroundColor: Colors.white, paddingHorizontal: 14, fontSize: 15, color: Colors.dark, textAlign: 'center' },
  formActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grey200 },
  cancelBtnText: { fontSize: 14, color: Colors.grey500 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.gold },
  saveBtnText: { fontSize: 14, color: Colors.white },
});

