import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useI18n } from '../i18n/useI18n';
import { ToolsHomeScreen } from '../tools/ToolsHomeScreen';
import { ProfileScreen } from '../profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export function BottomTabs() {
  const { t } = useI18n();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Tools"
        component={ToolsHomeScreen}
        options={{ tabBarLabel: t('tab_tools') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('tab_profile') }}
      />
    </Tab.Navigator>
  );
}
