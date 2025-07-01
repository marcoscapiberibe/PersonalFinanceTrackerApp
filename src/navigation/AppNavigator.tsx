import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';

// Screens
import SplashScreen from '../screens/SplashScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import SummaryScreen from '../screens/summary/SummaryScreen';
import BudgetScreen from '../screens/budget/BudgetScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen';
import AddBudgetScreen from '../screens/budget/AddBudgetScreen';
import TransactionDetailsScreen from '../screens/transactions/TransactionDetailsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Transactions') {
                        iconName = focused ? 'list' : 'list-outline';
                    } else if (route.name === 'Summary') {
                        iconName = focused ? 'analytics' : 'analytics-outline';
                    } else if (route.name === 'Budget') {
                        iconName = focused ? 'wallet' : 'wallet-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    } else {
                        iconName = 'help-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Transactions"
                component={TransactionsScreen}
                options={{
                    title: 'Transações',
                }}
            />
            <Tab.Screen
                name="Summary"
                component={SummaryScreen}
                options={{
                    title: 'Resumo',
                }}
            />
            <Tab.Screen
                name="Budget"
                component={BudgetScreen}
                options={{
                    title: 'Orçamentos',
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Configurações',
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#007AFF',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
                initialRouteName="Splash"
            >
                <Stack.Screen
                    name="Splash"
                    component={SplashScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="MainTabs"
                    component={MainTabs}
                    options={{ headerShown: false, title: 'Personal Finance Tracker App' }}
                />
                <Stack.Screen
                    name="AddTransaction"
                    component={AddTransactionScreen}
                    options={({ route }) => ({
                        title: route.params?.editTransaction ? 'Editar Transação' : 'Nova Transação',
                        presentation: 'modal',
                    })}
                />
                <Stack.Screen
                    name="AddBudget"
                    component={AddBudgetScreen}
                    options={({ route }) => ({
                        title: route.params?.editBudget ? 'Editar Orçamento' : 'Novo Orçamento',
                        presentation: 'modal',
                    })}
                />
                <Stack.Screen
                    name="TransactionDetails"
                    component={TransactionDetailsScreen}
                    options={{
                        title: 'Detalhes da Transação',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
