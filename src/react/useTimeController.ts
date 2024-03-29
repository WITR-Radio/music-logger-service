import {ChangeEvent, useState} from 'react'

import moment from "moment";

/**
 * Returns `true` if the given Date's time is AM. `false` if PM.
 *
 * @param date If the date is am
 */
function amOrPm(date: Date) {
    return moment(date).format('A') == 'AM'
}

/**
 * Properties for the useTimeController hook.
 */
interface TimeControllerProps {
    date: Date
    onChange: (date: Date) => void
}

/**
 * A hook for handling controlling logic for time/date selection components. This is used for searching/filtering
 * results, and is tedious/easy to mess up on its own.
 *
 * @param props The properties for the hook
 */
export default function useTimeController(props: TimeControllerProps) {
    const [am, setAm] = useState<boolean>(amOrPm(props.date))
    const [calendarDate, setCalendarDate] = useState<Date>(props.date)
    const [_moment, setMoment] = useState<moment.Moment>(moment(props.date))

    /**
     * Updates the calendar date and invokes `onChanged` in the props.
     *
     * @param newDate The new Date to process
     */
    function handleDate(newDate: Date) {
        setMoment(old => old.set({
            year: newDate.getFullYear(),
            month: newDate.getMonth(),
            date: newDate.getDate()
        }))

        setCalendarDate(newDate)
        updateDate()
    }

    /**
     * Updates the internal tracking date and invokes `onChanged` afterwards.
     *
     * @param amOverride `true` if the clock should switch to AM, `false` for PM. If unset, it will default to its
     *                    previous value.
     */
    function updateDate(amOverride: boolean = am) {
        const parsedTime = moment(`${_moment.format('h:mm')} ${amOverride ? 'AM' : 'PM'}`, ['h:mm A']);
        const merged = moment(_moment.toDate()).set({
            hours: parsedTime.get('hours'),
            minutes: parsedTime.get('minutes')
        });

        props.onChange(merged.toDate());
    }

    /**
     * Updates the hours from an event `HTMLInputEvent` with the value of the hour.
     *
     * @param e The ChangeEvent
     */
    function handleHour(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        let value = e.target.value
        let hour = value.length == 0 ? 1 : parseInt(value)
        if (hour <= 0 || hour > 12) {
            e.target.value = '1'
            return
        }

        setMoment(old => {
            old.set({
                hour: hour
            });

            updateDate()
            return old;
        })
    }

    /**
     * Updates the hours from an event `HTMLInputEvent` with the value of the minute.
     *
     * @param e The ChangeEvent
     */
    function handleMinute(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        let value = e.target.value
        let minute = value.length == 0 ? 0 : parseInt(value)
        if (minute < 0 || minute >= 60) {
            e.target.value = '0'
            return
        }

        setMoment(old => {
            old.set({
                minute: minute,
            });

            updateDate()
            return old;
        })
    }

    /**
     * Changes the AM/PM status of the time.
     *
     * @param am `true` if the time is AM, `false` if otherwise
     */
    function handleAmPm(am: boolean) {
        setAm(am)
        let newDate = new Date(props.date)
        let offset = am ? -12 : 12
        newDate.setHours(newDate.getHours() + offset)
        updateDate(am)
    }

    /**
     * Gets the default hour from the default date.
     */
    function defaultHour() {
        return moment(props.date).format('hh')
    }

    return {
        handleDate: handleDate,
        updateDate: updateDate,
        handleHour: handleHour,
        handleMinute: handleMinute,
        handleAmPm: handleAmPm,
        defaultHour: defaultHour,
        calendarDate: calendarDate,
        am: am
    }
}