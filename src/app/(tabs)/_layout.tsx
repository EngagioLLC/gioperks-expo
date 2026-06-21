import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { TabBarColors } from '@/constants/theme';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: MaterialIconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialIcons name={name} size={size} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TabBarColors.active,
        tabBarInactiveTintColor: TabBarColors.inactive,
        tabBarStyle: {
          backgroundColor: TabBarColors.barBackground,
          borderTopColor: TabBarColors.barBorder,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="games" options={{ title: 'Games', tabBarIcon: tabIcon('sports-esports') }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: tabIcon('qr-code-scanner') }} />
      <Tabs.Screen
        name="rewards"
        options={{ title: 'Rewards', tabBarIcon: tabIcon('card-giftcard') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
