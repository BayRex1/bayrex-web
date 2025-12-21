import { useState } from 'react';
import { I_INFO } from '../../System/UI/IconPack';
import GoldUsers from '../../System/Elements/GoldUsers';
import { useTranslation } from 'react-i18next';
import { DragDropArea } from '../../System/Elements/DragDropArea';
import './ViewEPACK.scss';
import { useModalsStore } from '../../Store/modalsStore';
import Post from './Components/Post';
import CommentComponent from './Components/Comment';
import { normalizeEPACK } from './Utils/parsers';

const ViewEPACK = () => {
  const { t } = useTranslation();
  const [epackVersion, setEpackVersion] = useState('');
  const [post, setPost] = useState('');
  const [comments, setComments] = useState([]);
  const { openModal } = useModalsStore() as any;

  const handleFileChange = (event) => {
    const input = event.target?.files?.[0];
    if (input) {
      const fileFormat = input.name.split('.').pop();
      if (input && fileFormat === 'epack') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent = e.target?.result;
          if (fileContent && typeof fileContent === 'string') {
            HandleEPACK(JSON.parse(fileContent));
          }
        };
        reader.readAsText(input);
      } else {
        openModal({
          type: 'alert',
          props: {
            title: t('error'),
            message: 'Файл должен быть формата «epack»'
          }
        });
      }
    }
  };

  const handleFilesDrop = (files) => {
    if (files.length > 0) {
      const file = files[0];
      const fileFormat = file.name.split('.').pop();
      if (fileFormat === 'epack') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent = e.target?.result;
          if (fileContent && typeof fileContent === 'string') {
            HandleEPACK(JSON.parse(fileContent));
          }
        };
        reader.readAsText(file);
      } else {
        openModal({
          type: 'alert',
          props: {
            title: t('error'),
            message: 'Файл должен быть формата «epack»'
          }
        });
      }
    }
  };

  const HandleEPACK = (epackData) => {
    try {
      const loadedData: any = normalizeEPACK(epackData);
      setEpackVersion(epackData.E_VER);
      setPost(loadedData.post);
      setComments(loadedData.comments);
    } catch (e) {
      openModal({
        type: 'alert',
        props: {
          title: 'Error',
          message: 'Ой, что-то пошло не так...'
        }
      });
    }
  }

  return (
    <>
      <div className="UI-C_L">
        <div className="UI-ScrollView">
          <div className="UI-Block UI-B_FIRST">
            <div className="UI-Title">Загрузка файла</div>
            <DragDropArea
              className="EPACK-FileInput"
              data-text={t('drop_epack_file_here')}
              onFilesDrop={handleFilesDrop}
            >
              <input id="fileInput" type="file" accept=".epack" onChange={handleFileChange} />
              <label htmlFor="fileInput">
                {t('select_file')}
              </label>
              <div className="Text">
                {t('epack_warning')}
              </div>
            </DragDropArea>
          </div>
          <div className="UI-Block UI-InfoBlock">
            <I_INFO />
            <div>
              {t('epack_info')}
            </div>
          </div>
          <div>
            {post ? (
              <Post post={post} />
            ) : (
              <div className="UI-ErrorMessage">Файл не выбран</div>
            )}
            {comments.length > 0 && (
              <>
                <div className="UI-PartitionName">{t('comments')}</div>
                {comments.map((comment, index) => (
                  <CommentComponent
                    key={index}
                    eVer={epackVersion}
                    comment={comment}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="UI-C_R">
        <div className="UI-ScrollView">
          <div className="UI-Block UI-B_FIRST">
            <div className="UI-Title">{t('gold_users_list_1')}</div>
            <div className="GoldSub-Users">
              <GoldUsers />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ViewEPACK;
