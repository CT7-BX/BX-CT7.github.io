"""Fail-closed publication policy; scheduled and PR runs must stay read-only."""
import os


def should_publish(event, verify_only=False):
    if event == 'push':
        return True
    if event != 'workflow_dispatch':
        return False
    return str(verify_only).lower() in ('false', '', 'none')


def main():
    publish = should_publish(os.environ.get('GITHUB_EVENT_NAME', ''), os.environ.get('VERIFY_ONLY', 'false'))
    value = 'publish=' + str(publish).lower()
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
            output.write(value + '\n')
    print(value)


if __name__ == '__main__':
    main()
