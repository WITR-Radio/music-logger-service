import React, {ChangeEvent} from 'react'

import moment from "moment";

export class TimeController {
    // const [am, setAm] = useState<boolean>(amOrPm(props.date))
    // const [calendarDate, setCalendarDate] = useState<Date>(props.date)
    // const [this.moment, setMoment] = useState<moment.Moment>(moment(props.date))

    readonly _date: () => Date

    get date(): Date {
        return this._date()
    }

    readonly onChange: (date: Date) => void

    readonly _am: () => boolean

    get am(): boolean {
        return this._am()
    }

    readonly setAm: (am: boolean) => void

    readonly _moment: () => moment.Moment

    get moment(): moment.Moment {
        return this._moment()
    }

    readonly setMoment: React.Dispatch<React.SetStateAction<moment.Moment>>

    readonly setCalendarDate: React.Dispatch<React.SetStateAction<Date>>

    constructor(date: () => Date, onChange: (date: Date) => void, am: () => boolean, setAm: (am: boolean) => void, moment: () => moment.Moment, setMoment: React.Dispatch<React.SetStateAction<moment.Moment>>, setCalendarDate: React.Dispatch<React.SetStateAction<Date>>) {
        this._date = date
        this.onChange = onChange
        this._am = am
        this.setAm = setAm
        this._moment = moment
        this.setMoment = setMoment
        this.setCalendarDate = setCalendarDate
    }

    handleDate(newDate: Date) {
        this.setMoment(old => old.set({
            year: newDate.getFullYear(),
            month: newDate.getMonth(),
            date: newDate.getDate()
        }))

        this.setCalendarDate(newDate)
        this.updateDate()
    }

    updateDate(amOverride: boolean = this.am) {
        const parsedTime = moment(`${this.moment.format('h:mm')} ${amOverride ? 'AM' : 'PM'}`, ['h:mm A']);
        const merged = moment(this.moment.toDate()).set({
            hours: parsedTime.get('hours'),
            minutes: parsedTime.get('minutes')
        });

        this.onChange(merged.toDate());
    }

    handleHour(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        let value = e.target.value
        let hour = value.length == 0 ? 1 : parseInt(value)
        if (hour <= 0 || hour > 12) {
            e.target.value = '1'
            return
        }

        this.setMoment(old => {
            old.set({
                hour: hour
            });

            this.updateDate()
            return old;
        })
    }

    handleMinute(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        let value = e.target.value
        let minute = value.length == 0 ? 0 : parseInt(value)
        if (minute < 0 || minute >= 60) {
            e.target.value = '0'
            return
        }

        this.setMoment(old => {
            old.set({
                minute: minute,
            });

            this.updateDate()
            return old;
        })
    }

    handleAmPm(am: boolean) {
        this.setAm(am)
        let newDate = new Date(this.date)
        let offset = am ? -12 : 12
        newDate.setHours(newDate.getHours() + offset)
        this.updateDate(am)
    }

    processHour(hour: number) {
        if (hour > 12) {
            return hour - 12;
        }

        return hour;
    }
}