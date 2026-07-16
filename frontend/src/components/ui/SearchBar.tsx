import { StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SearchIcon, XIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export function SearchBar({ value, onChangeText, placeholder = 'Procurar', onClear, style }: SearchBarProps) {
  const { fontRegular } = useAppFonts();
  return (
    <View style={[styles.container, style]}>
      <SearchIcon color={Colors.grey400} size={18} />
      <TextInput
        style={[styles.input, { fontFamily: fontRegular }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.grey400}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <XIcon size={16} color={Colors.grey400} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  input: {
    flex: 1,
    color: Colors.dark,
    fontSize: 15,
    padding: 0,
  },
});
