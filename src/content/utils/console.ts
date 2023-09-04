export function prettyConsole(
    message: string,
    color?: 'blue' | 'red' | 'green',
    object?: any
) {
    color ??= 'blue'
    message = `%c🏄‍♂️ SuperUnfollow: %c${message}`
    const messageStyle = {
        blue: 'color: dodgerblue;',
        red: 'color: coral;',
        green: 'color: lightgreen;',
    }

    const titleStyle =
        'color: mediumpurple; font-variant-caps: petite-caps; font-size: 1.1rem;'
    const logArgs = object
        ? [message, titleStyle, messageStyle[color], object]
        : [message, titleStyle, messageStyle[color]]
    console.log(...logArgs)
}
