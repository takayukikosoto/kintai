import AttendancePanel from '../components/AttendancePanel'
import TimesheetHistory from '../components/TimesheetHistory'
import AdminTimesheetView from '../components/AdminTimesheetView'

interface HomePageProps {
  userId: string
  defaultRate: number
  isAdmin?: boolean
}

export default function HomePage({ userId, defaultRate, isAdmin = false }: HomePageProps) {
  return (
    <>
      <AttendancePanel userId={userId} defaultRate={defaultRate} />
      {isAdmin ? (
        <AdminTimesheetView userId={userId} />
      ) : (
        <TimesheetHistory userId={userId} isAdmin={false} />
      )}
    </>
  )
}
