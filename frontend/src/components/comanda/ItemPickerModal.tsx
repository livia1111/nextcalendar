import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SearchIcon, XIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { formatBRL } from '@/utils/money';

/** Item genérico do seletor — serve tanto para serviço quanto para produto. */
export type PickerItem = {
  id: string;
  name: string;
  price: number;
  /** Texto pequeno abaixo do nome (ex: categoria, estoque). */
  subtitle?: string;
  /** Item não selecionável (ex: produto sem estoque). */
  disabled?: boolean;
  disabledLabel?: string;
};

interface ItemPickerModalProps {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  emptyText: string;
  items: PickerItem[];
  loading?: boolean;
  submitting?: boolean;
  /** Erro ao adicionar (mostrado dentro do modal). */
  error?: string;
  onClose: () => void;
  onConfirm: (item: PickerItem, quantity: number) => void;
}

const MAX_QTY = 99;

/** Bottom sheet para escolher um serviço/produto e a quantidade. */
export function ItemPickerModal({
  visible,
  title,
  searchPlaceholder,
  emptyText,
  items,
  loading,
  submitting,
  error,
  onClose,
  onConfirm,
}: ItemPickerModalProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSelectedId(null);
      setQuantity(1);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>{title}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <XIcon size={18} color={Colors.grey500} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <SearchIcon size={18} />
          <TextInput
            style={[styles.searchInput, { fontFamily: fontRegular }]}
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={Colors.grey400}
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={[styles.emptyText, { fontFamily: fontRegular }]}>{emptyText}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowSelected, item.disabled && styles.rowDisabled]}
                  activeOpacity={0.75}
                  disabled={item.disabled}
                  onPress={() => {
                    setSelectedId(item.id);
                    setQuantity(1);
                  }}>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.subtitle ? (
                      <Text style={[styles.rowSub, { fontFamily: fontRegular }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {item.disabled ? (
                    <Text style={[styles.disabledLabel, { fontFamily: fontSemiBold }]}>
                      {item.disabledLabel ?? 'Indisponível'}
                    </Text>
                  ) : (
                    <Text style={[styles.rowPrice, { fontFamily: fontBold }]}>{formatBRL(item.price)}</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Rodapé: quantidade + confirmar (aparece quando há item selecionado) */}
        {selected && (
          <View style={styles.footer}>
            <View style={styles.qtyRow}>
              <Text style={[styles.qtyLabel, { fontFamily: fontSemiBold }]}>Quantidade</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, quantity <= 1 && styles.stepBtnOff]}
                  disabled={quantity <= 1}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Text style={[styles.stepText, { fontFamily: fontBold }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.qtyValue, { fontFamily: fontBold }]}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, quantity >= MAX_QTY && styles.stepBtnOff]}
                  disabled={quantity >= MAX_QTY}
                  onPress={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}>
                  <Text style={[styles.stepText, { fontFamily: fontBold }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            {error ? <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{error}</Text> : null}
            <Button
              label={`Adicionar • ${formatBRL(selected.price * quantity)}`}
              loading={submitting}
              onPress={() => onConfirm(selected, quantity)}
            />
          </View>
        )}
        {!selected && error ? (
          <Text style={[styles.errorText, { fontFamily: fontRegular, paddingHorizontal: 24 }]}>{error}</Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(13, 13, 18, 0.45)' },
  sheet: {
    height: '80%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  title: { fontSize: 18, color: Colors.dark },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.dark, padding: 0 },
  list: { flex: 1, paddingHorizontal: 24 },
  centerBox: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.grey400, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.white,
  },
  rowSelected: { borderColor: Colors.gold, backgroundColor: '#FFFCF5' },
  rowDisabled: { opacity: 0.5 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, color: Colors.dark },
  rowSub: { fontSize: 12, color: Colors.grey400 },
  rowPrice: { fontSize: 14, color: Colors.goldDark },
  disabledLabel: { fontSize: 12, color: Colors.error },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyLabel: { fontSize: 14, color: Colors.dark },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { opacity: 0.4 },
  stepText: { fontSize: 18, color: Colors.dark, lineHeight: 22 },
  qtyValue: { fontSize: 16, color: Colors.dark, minWidth: 24, textAlign: 'center' },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
});