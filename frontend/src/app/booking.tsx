import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon, MenuDotsIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default function BookingScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedTime, setSelectedTime] = useState('');

  const calendar = buildCalendar(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <ChevronLeftIcon />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { fontFamily: fontSemiBold }]}>Agendamento</Text>
          <TouchableOpacity style={styles.navBtn}>
            <MenuDotsIcon />
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Selecione a data</Text>

          <View style={styles.calendarCard}>
            {/* Month Nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                <ChevronLeftIcon size={18} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { fontFamily: fontSemiBold }]}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={[styles.monthNavBtn, { transform: [{ rotate: '180deg' }] }]}>
                <ChevronLeftIcon size={18} />
              </TouchableOpacity>
            </View>

            {/* Week days */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map(d => (
                <Text key={d} style={[styles.weekDay, { fontFamily: fontSemiBold }]}>{d}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.daysGrid}>
              {calendar.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    day === selectedDay && styles.dayCellSelected,
                    !day && styles.dayCellEmpty,
                  ]}
                  disabled={!day}
                  onPress={() => day && setSelectedDay(day)}>
                  {day ? (
                    <Text style={[
                      styles.dayText,
                      { fontFamily: fontRegular },
                      day === selectedDay && styles.dayTextSelected,
                    ]}>
                      {day}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Time picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Selecione o Horário</Text>
          <View style={styles.timesGrid}>
            {TIMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeCell, selectedTime === t && styles.timeCellSelected]}
                onPress={() => setSelectedTime(t)}>
                <Text style={[
                  styles.timeText,
                  { fontFamily: fontRegular },
                  selectedTime === t && styles.timeTextSelected,
                ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Confirmar Agendamento" onPress={() => router.back()} disabled={!selectedTime} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 20, gap: 24 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.grey100, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: Colors.dark, fontSize: 18 },
  section: { gap: 14 },
  sectionTitle: { color: Colors.dark, fontSize: 16, fontWeight: '600' },
  calendarCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 16 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthNavBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: Colors.dark, fontSize: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { width: 36, textAlign: 'center', color: Colors.grey400, fontSize: 11 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 100 },
  dayCellSelected: { backgroundColor: Colors.gold },
  dayCellEmpty: { opacity: 0 },
  dayText: { color: Colors.dark, fontSize: 14 },
  dayTextSelected: { color: Colors.white, fontWeight: '700' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeCell: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.grey100, backgroundColor: Colors.white },
  timeCellSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  timeText: { color: Colors.dark, fontSize: 14 },
  timeTextSelected: { color: Colors.white, fontWeight: '600' },
  bottomCTA: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.grey100 },
});
