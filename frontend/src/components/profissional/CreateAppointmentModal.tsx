import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { ChevronLeftIcon, ClockIcon, SearchIcon } from '@/components/icons';
import {
  createAppointment,
  getAvailableSlots,
} from '@/services/appointmentServices';
import { listarServicos, type ServiceResponse } from '@/services/serviceServices';
import { searchClients, type ClientMin } from '@/services/clientServices';
import { isAxiosError } from 'axios';

interface CreateAppointmentModalProps {
  visible: boolean;
  establishmentId: string;
  professionalId: string;
  defaultDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAppointmentModal({
  visible,
  establishmentId,
  professionalId,
  defaultDate,
  onClose,
  onSuccess,
}: CreateAppointmentModalProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();

  // Tipo de cliente: cadastrado ou avulso
  const [clientType, setClientType] = useState<'registered' | 'quick'>('quick');

  // Cliente cadastrado (busca)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClientMin[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientMin | null>(null);
  const [searchingClient, setSearchingClient] = useState(false);

  // Cliente avulso
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Serviços
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);

  // Data
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (defaultDate) return defaultDate;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Encaixe & Notas
  const [isFitIn, setIsFitIn] = useState(false);
  const [notes, setNotes] = useState('');

  // Submissão
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset ao abrir
  useEffect(() => {
    if (visible) {
      if (defaultDate) setSelectedDate(defaultDate);
      setSelectedSlot(null);
      setErrorMsg(null);
      setNotes('');
      setIsFitIn(false);
    }
  }, [visible, defaultDate]);

  // Carrega serviços
  useEffect(() => {
    if (!visible || !establishmentId) return;

    let active = true;
    async function load() {
      setLoadingServices(true);
      try {
        const list = await listarServicos(establishmentId);
        if (active) {
          setServices(list);
          if (list.length > 0 && !selectedServiceId) {
            setSelectedServiceId(list[0].id);
          }
        }
      } catch {
        // Silencia
      } finally {
        if (active) setLoadingServices(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [visible, establishmentId]);

  // Busca de clientes cadastrados
  useEffect(() => {
    if (clientType !== 'registered' || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingClient(true);
      try {
        const res = await searchClients(searchQuery.trim());
        setSearchResults(res.content || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingClient(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, clientType]);

  // Carrega horários disponíveis
  useEffect(() => {
    if (!visible || !establishmentId || !professionalId || !selectedServiceId) return;

    let active = true;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setErrorMsg(null);
      try {
        const res = await getAvailableSlots(
          establishmentId,
          professionalId,
          selectedServiceId!,
          selectedDate
        );
        if (active) {
          setAvailableSlots(res.slots || []);
        }
      } catch {
        if (active) {
          setAvailableSlots([]);
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    fetchSlots();
    return () => {
      active = false;
    };
  }, [visible, establishmentId, professionalId, selectedServiceId, selectedDate]);

  function handleDateChange(deltaDays: number) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + deltaDays);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  }

  function formatDisplayDate(dateStr: string) {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  const canSubmit =
    !!selectedServiceId &&
    !!selectedSlot &&
    (clientType === 'quick' ? clientName.trim().length > 0 : !!selectedClient);

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setErrorMsg(null);

    const timePart = selectedSlot!.length === 5 ? `${selectedSlot}:00` : selectedSlot;
    const startDateTime = `${selectedDate}T${timePart}`;

    try {
      await createAppointment(establishmentId, {
        professionalId,
        serviceId: selectedServiceId!,
        clientId: clientType === 'registered' ? selectedClient?.id : undefined,
        clientNameFallback: clientType === 'quick' ? clientName.trim() : undefined,
        clientPhoneFallback: clientType === 'quick' ? clientPhone.trim() : undefined,
        startDateTime,
        isFitIn,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Sucesso', 'Agendamento criado com sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      let msg = 'Não foi possível criar o agendamento.';
      if (isAxiosError(err)) {
        msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : msg);
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
              Novo Agendamento
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Escolha tipo de cliente */}
            <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>Cliente</Text>
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, clientType === 'quick' && styles.tabBtnActive]}
                onPress={() => setClientType('quick')}>
                <Text style={[styles.tabText, clientType === 'quick' && styles.tabTextActive, { fontFamily: fontSemiBold }]}>
                  Cadastro Rápido
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, clientType === 'registered' && styles.tabBtnActive]}
                onPress={() => setClientType('registered')}>
                <Text style={[styles.tabText, clientType === 'registered' && styles.tabTextActive, { fontFamily: fontSemiBold }]}>
                  Cliente Cadastrado
                </Text>
              </TouchableOpacity>
            </View>

            {clientType === 'quick' ? (
              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.input, { fontFamily: fontRegular }]}
                  placeholder="Nome do cliente *"
                  placeholderTextColor={Colors.grey400}
                  value={clientName}
                  onChangeText={setClientName}
                />
                <TextInput
                  style={[styles.input, { fontFamily: fontRegular }]}
                  placeholder="Telefone (opcional)"
                  placeholderTextColor={Colors.grey400}
                  keyboardType="phone-pad"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                {selectedClient ? (
                  <View style={styles.selectedClientCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.clientName, { fontFamily: fontSemiBold }]}>
                        {selectedClient.name}
                      </Text>
                      {selectedClient.phone ? (
                        <Text style={[styles.clientPhone, { fontFamily: fontRegular }]}>
                          {selectedClient.phone}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity onPress={() => setSelectedClient(null)}>
                      <Text style={styles.changeClientText}>Trocar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.searchBox}>
                      <SearchIcon size={16} color={Colors.grey400} />
                      <TextInput
                        style={[styles.searchInput, { fontFamily: fontRegular }]}
                        placeholder="Buscar por nome ou e-mail..."
                        placeholderTextColor={Colors.grey400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchingClient && <ActivityIndicator size="small" color={Colors.gold} />}
                    </View>

                    {searchResults.length > 0 && (
                      <View style={styles.resultsList}>
                        {searchResults.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.resultItem}
                            onPress={() => {
                              setSelectedClient(c);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}>
                            <Text style={[styles.resultName, { fontFamily: fontSemiBold }]}>
                              {c.name}
                            </Text>
                            <Text style={[styles.resultSub, { fontFamily: fontRegular }]}>
                              {c.phone || c.email}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Escolha do Serviço */}
            <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>Serviço</Text>
            {loadingServices ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceScroll}>
                {services.map((svc) => {
                  const isSelected = selectedServiceId === svc.id;
                  return (
                    <TouchableOpacity
                      key={svc.id}
                      style={[styles.serviceChip, isSelected && styles.serviceChipSelected]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedServiceId(svc.id)}>
                      <Text
                        style={[
                          styles.serviceChipName,
                          { fontFamily: fontSemiBold },
                          isSelected && styles.serviceChipNameSelected,
                        ]}>
                        {svc.name}
                      </Text>
                      <Text
                        style={[
                          styles.serviceChipPrice,
                          { fontFamily: fontRegular },
                          isSelected && styles.serviceChipPriceSelected,
                        ]}>
                        R$ {svc.price.toFixed(2)} • {svc.duration}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Data */}
            <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>Data</Text>
            <View style={styles.dateSelector}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => handleDateChange(-1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>

              <Text style={[styles.dateText, { fontFamily: fontSemiBold }]}>
                {formatDisplayDate(selectedDate)}
              </Text>

              <TouchableOpacity
                style={[styles.navBtn, { transform: [{ rotate: '180deg' }] }]}
                onPress={() => handleDateChange(1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Horários Livres */}
            <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>Horário</Text>
            {loadingSlots ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={Colors.gold} />
                <Text style={[styles.hintText, { fontFamily: fontRegular }]}>
                  Buscando horários disponíveis...
                </Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={[styles.hintText, { fontFamily: fontRegular }]}>
                  Nenhum horário livre nesta data.
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedSlot(slot)}>
                      <ClockIcon
                        size={12}
                        color={isSelected ? Colors.white : Colors.dark}
                      />
                      <Text
                        style={[
                          styles.slotText,
                          { fontFamily: isSelected ? fontBold : fontRegular },
                          isSelected && styles.slotTextSelected,
                        ]}>
                        {slot.slice(0, 5)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Encaixe */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.switchLabel, { fontFamily: fontSemiBold }]}>
                  Agendamento de Encaixe
                </Text>
                <Text style={[styles.switchSub, { fontFamily: fontRegular }]}>
                  Permite agendar mesmo com sobreposição de horário
                </Text>
              </View>
              <Switch
                value={isFitIn}
                onValueChange={setIsFitIn}
                trackColor={{ false: Colors.grey200, true: Colors.gold }}
                thumbColor={Colors.white}
              />
            </View>

            {/* Observações */}
            <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>
              Observações (opcional)
            </Text>
            <TextInput
              style={[styles.input, { height: 64, fontFamily: fontRegular }]}
              placeholder="Ex: preferência por corte na tesoura..."
              placeholderTextColor={Colors.grey400}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            {/* Erro */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontFamily: fontRegular }]}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, (!canSubmit || submitting) && styles.btnDisabled]}
              activeOpacity={0.8}
              disabled={!canSubmit || submitting}
              onPress={handleSubmit}>
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={[styles.confirmBtnText, { fontFamily: fontSemiBold }]}>
                  Confirmar Agendamento
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={onClose}>
              <Text style={[styles.cancelBtnText, { fontFamily: fontSemiBold }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    maxWidth: 440,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  title: {
    fontSize: 17,
    color: Colors.dark,
  },
  closeIcon: {
    fontSize: 18,
    color: Colors.grey400,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.grey500,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: Colors.grey400,
  },
  tabTextActive: {
    color: Colors.dark,
  },
  formGroup: {
    gap: 10,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
  },
  resultsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
    overflow: 'hidden',
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  resultName: {
    fontSize: 14,
    color: Colors.dark,
  },
  resultSub: {
    fontSize: 12,
    color: Colors.grey400,
  },
  selectedClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  clientName: {
    fontSize: 14,
    color: Colors.dark,
  },
  clientPhone: {
    fontSize: 12,
    color: Colors.grey400,
  },
  changeClientText: {
    color: Colors.goldDark,
    fontSize: 12,
    fontWeight: '600',
  },
  serviceScroll: {
    flexGrow: 0,
  },
  serviceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grey200,
    backgroundColor: Colors.white,
    marginRight: 8,
    gap: 2,
  },
  serviceChipSelected: {
    borderColor: Colors.gold,
    backgroundColor: '#FEF9EE',
  },
  serviceChipName: {
    fontSize: 13,
    color: Colors.dark,
  },
  serviceChipNameSelected: {
    color: Colors.goldDark,
  },
  serviceChipPrice: {
    fontSize: 11,
    color: Colors.grey400,
  },
  serviceChipPriceSelected: {
    color: Colors.goldDark,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    color: Colors.dark,
  },
  loadingBox: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  emptyBox: {
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: Colors.grey400,
    textAlign: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grey200,
    backgroundColor: Colors.white,
  },
  slotChipSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  slotText: {
    fontSize: 13,
    color: Colors.dark,
  },
  slotTextSelected: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
  },
  switchLabel: {
    fontSize: 13,
    color: Colors.dark,
  },
  switchSub: {
    fontSize: 11,
    color: Colors.grey400,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
  },
  confirmBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.grey500,
    fontSize: 14,
  },
});
