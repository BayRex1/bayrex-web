import { CodeBlock } from 'react-code-block';

const ApiCode = ({ code }) => {

    return (
        <div className="UI-Code">
            <div className="Body">
                <CodeBlock code={code} language="js">
                    <CodeBlock.Code className="bg-gray-900 p-6 rounded-xl shadow-lg">
                        <div className="table-row">
                            <CodeBlock.LineContent className="table-cell">
                                <CodeBlock.Token />
                            </CodeBlock.LineContent>
                        </div>
                    </CodeBlock.Code>
                </CodeBlock>
            </div>
        </div>
    );
};

export default ApiCode;
