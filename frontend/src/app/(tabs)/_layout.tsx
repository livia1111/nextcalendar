import { Tabs, useRouter } from 'expo-router';
import { ColorValue, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ExploreTabIcon, HomeTabIcon, MessageTabIcon, QRTabIcon, UserTabIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';

interface TabBarIconProps {
  focused: boolean;
  color: ColorValue;
  size: number;
}

function HomeIcon({ focused }: TabBarIconProps) {
  return <HomeTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function ExploreIcon({ focused }: TabBarIconProps) {
  return <ExploreTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function MessageIcon({ focused }: TabBarIconProps) {
  return <MessageTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function ProfileIcon({ focused }: TabBarIconProps) {
  return <UserTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.grey400,
        tabBarShowLabel: false,
      }}>

      <Tabs.Screen
        name="home"
        options={{ tabBarIcon: HomeIcon }}
      />
      <Tabs.Screen
        name="search"
        options={{ tabBarIcon: ExploreIcon }}
      />
      {/* Central QR Button */}
      <Tabs.Screen
        name="booking-tab"
        options={{
          tabBarIcon: () => null,
          tabBarButton: ({ onPress }) => (
            <TouchableOpacity
              onPress={onPress}
              style={styles.centerButton}
              activeOpacity={0.9}>
              <View style={styles.centerInner}>
                <QRTabIcon size={26} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{ tabBarIcon: MessageIcon }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ProfileIcon }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    elevation: 8,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  centerButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
