import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CreateBookingScreen from "./CreateBookingScreen";
import LogoutScreen from "./LogoutScreen";
import MyBookingsScreen from "./MyBookingsScreen";

const Tab = createBottomTabNavigator();

export default function BookingTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Ny bokning" component={CreateBookingScreen} />
      <Tab.Screen name="Mina bokningar" component={MyBookingsScreen} />
      <Tab.Screen name="Logga ut" component={LogoutScreen} />
    </Tab.Navigator>
  );
}
